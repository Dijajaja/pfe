import csv
import io

from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsAdmin
from accounts.serializers import (
    AdminUserSerializer,
    AdminUserUpdateSerializer,
    InscriptionEtudiantSerializer,
    UserSerializer,
)


class InscriptionEtudiantView(generics.CreateAPIView):
    """Inscription réservée aux étudiants (hors JWT, avant première connexion)."""

    serializer_class = InscriptionEtudiantSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MoiView(APIView):
    """Profil de l’utilisateur connecté (JWT)."""

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AdminUsersListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = (IsAuthenticated, IsAdmin)
    queryset = User.objects.all().order_by("-date_creation")

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get("role")
        active = self.request.query_params.get("is_active")
        if role:
            qs = qs.filter(role=role)
        if active is not None:
            normalized = str(active).lower() in {"1", "true", "yes"}
            qs = qs.filter(is_active=normalized)
        return qs


class AdminUserDetailView(generics.UpdateAPIView):
    serializer_class = AdminUserUpdateSerializer
    permission_classes = (IsAuthenticated, IsAdmin)
    queryset = User.objects.all()


class AdminImportEtudiantsCsvView(APIView):
    """
    Import CSV robuste pour remplacer les échanges via clé USB CNOU.
    Colonnes requises: email, matricule, etablissement, filiere
    Colonnes optionnelles: first_name, last_name
    """

    permission_classes = (IsAuthenticated, IsAdmin)
    parser_classes = (MultiPartParser,)

    @transaction.atomic
    def post(self, request):
        uploaded = request.FILES.get("file")
        if not uploaded:
            return Response({"detail": "Fichier CSV manquant (champ 'file')."}, status=400)

        try:
            text = uploaded.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            return Response({"detail": "Encodage invalide. Utilisez UTF-8."}, status=400)

        reader = csv.DictReader(io.StringIO(text))
        required = {"email", "matricule", "etablissement", "filiere"}
        headers = set(reader.fieldnames or [])
        missing = required - headers
        if missing:
            return Response(
                {"detail": f"Colonnes manquantes: {', '.join(sorted(missing))}"},
                status=400,
            )

        imported = 0
        updated = 0
        errors: list[str] = []

        from accounts.models import EtudiantProfile

        for idx, row in enumerate(reader, start=2):
            email = (row.get("email") or "").strip().lower()
            matricule = (row.get("matricule") or "").strip()
            etablissement = (row.get("etablissement") or "").strip()
            filiere = (row.get("filiere") or "").strip()
            first_name = (row.get("first_name") or "").strip()
            last_name = (row.get("last_name") or "").strip()

            if not email or not matricule or not etablissement or not filiere:
                errors.append(f"Ligne {idx}: champs requis incomplets.")
                continue

            try:
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "role": User.Role.ETUDIANT,
                        "is_active": True,
                        "first_name": first_name,
                        "last_name": last_name,
                    },
                )
                if created:
                    user.set_unusable_password()
                    user.save(update_fields=["password"])
                    imported += 1
                else:
                    changed = False
                    if user.role != User.Role.ETUDIANT:
                        user.role = User.Role.ETUDIANT
                        changed = True
                    if first_name and user.first_name != first_name:
                        user.first_name = first_name
                        changed = True
                    if last_name and user.last_name != last_name:
                        user.last_name = last_name
                        changed = True
                    if changed:
                        user.save(update_fields=["role", "first_name", "last_name"])

                profile, _ = EtudiantProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        "matricule": matricule,
                        "etablissement": etablissement,
                        "filiere": filiere,
                    },
                )

                profile_changed = False
                if profile.matricule != matricule:
                    if EtudiantProfile.objects.exclude(pk=profile.pk).filter(matricule=matricule).exists():
                        errors.append(f"Ligne {idx}: matricule déjà utilisé ({matricule}).")
                        continue
                    profile.matricule = matricule
                    profile_changed = True
                if profile.etablissement != etablissement:
                    profile.etablissement = etablissement
                    profile_changed = True
                if profile.filiere != filiere:
                    profile.filiere = filiere
                    profile_changed = True
                if profile_changed:
                    profile.save()
                    if not created:
                        updated += 1
            except Exception as exc:  # pragma: no cover - robustesse import
                errors.append(f"Ligne {idx}: {exc}")

        return Response(
            {
                "imported": imported,
                "updated": updated,
                "errors": errors,
                "total_errors": len(errors),
            },
            status=status.HTTP_200_OK,
        )
