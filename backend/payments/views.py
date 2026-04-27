import hashlib
import json

from django.db import IntegrityError, transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin, IsEtudiant, IsPartenaire
from dossiers.models import DossierBourse, DossierHistorique

from .models import ListeBeneficiaires, Paiement, PartenaireOperationLog
from .serializers import (
    GenererListeSerializer,
    ListeBeneficiairesSerializer,
    PartenaireConfirmationSerializer,
    PaiementSerializer,
)
from .services import confirmer_paiements, envoyer_dossier_a_mauripost, generer_liste_beneficiaires


class AdminListeBeneficiairesViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdmin]
    serializer_class = ListeBeneficiairesSerializer
    queryset = ListeBeneficiaires.objects.select_related(
        "annee_universitaire", "partenaire"
    ).annotate(nombre_paiements=Count("paiements", distinct=True))

    def get_queryset(self):
        qs = super().get_queryset()
        annee = self.request.query_params.get("annee_universitaire")
        if annee:
            qs = qs.filter(annee_universitaire_id=annee)
        return qs

    def get_serializer_class(self):
        if self.action == "generer":
            return GenererListeSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=["post"], url_path="generer")
    def generer(self, request):
        ser = GenererListeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        annee = ser.validated_data["annee_universitaire_id"]
        periode = ser.validated_data.get("periode") or ""
        montant_defaut = ser.validated_data.get("montant_defaut")
        liste = generer_liste_beneficiaires(
            annee=annee,
            periode=periode,
            montant_defaut=montant_defaut,
        )
        liste = ListeBeneficiaires.objects.annotate(
            nombre_paiements=Count("paiements", distinct=True)
        ).get(pk=liste.pk)
        out = ListeBeneficiairesSerializer(
            liste, context={"request": request}
        ).data
        return Response(out, status=status.HTTP_201_CREATED)


class AdminPaiementViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdmin]
    serializer_class = PaiementSerializer
    queryset = Paiement.objects.select_related(
        "liste", "dossier", "annee_universitaire"
    )

    def get_queryset(self):
        qs = super().get_queryset()
        annee = self.request.query_params.get("annee_universitaire")
        liste = self.request.query_params.get("liste")
        statut = self.request.query_params.get("statut")
        if annee:
            qs = qs.filter(annee_universitaire_id=annee)
        if liste:
            qs = qs.filter(liste_id=liste)
        if statut:
            qs = qs.filter(statut=statut)
        return qs


class PartnerListeView(APIView):
    permission_classes = [IsPartenaire]

    def get(self, request, reference):
        liste = get_object_or_404(
            ListeBeneficiaires.objects.select_related("annee_universitaire"),
            reference=reference,
        )
        assignee = liste.partenaire_id
        if assignee and assignee != request.user.id:
            return Response(
                {"detail": "Liste non assignée à votre compte."},
                status=status.HTTP_403_FORBIDDEN,
            )
        paiements = Paiement.objects.filter(liste=liste).select_related("dossier")
        data = ListeBeneficiairesSerializer(liste).data
        data["paiements"] = PaiementSerializer(paiements, many=True).data
        return Response(data)


class PartnerConfirmationView(APIView):
    permission_classes = [IsPartenaire]

    def post(self, request):
        ser = PartenaireConfirmationSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        operations = ser.validated_data["operations"]
        key = request.headers.get("X-Idempotency-Key", "").strip()

        if not key:
            count, errors = confirmer_paiements(
                updates=operations,
                utilisateur_partenaire_id=request.user.id,
            )
            return Response({"mis_a_jour": count, "erreurs": errors, "idempotent": False})

        payload = json.dumps(operations, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
        payload_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        existing = PartenaireOperationLog.objects.filter(
            partenaire_id=request.user.id,
            idempotency_key=key,
        ).first()
        if existing:
            if existing.request_hash != payload_hash:
                return Response(
                    {"detail": "Conflit idempotence: même clé avec payload différent."},
                    status=status.HTTP_409_CONFLICT,
                )
            data = existing.response_data or {}
            data["idempotent"] = True
            return Response(data, status=status.HTTP_200_OK)

        with transaction.atomic():
            count, errors = confirmer_paiements(
                updates=operations,
                utilisateur_partenaire_id=request.user.id,
            )
            response_payload = {
                "mis_a_jour": count,
                "erreurs": errors,
                "idempotent": False,
            }
            try:
                PartenaireOperationLog.objects.create(
                    partenaire_id=request.user.id,
                    idempotency_key=key,
                    request_hash=payload_hash,
                    response_data=response_payload,
                )
            except IntegrityError:
                # Course concurrente: relit le log et renvoie la réponse persistée.
                race = PartenaireOperationLog.objects.get(
                    partenaire_id=request.user.id,
                    idempotency_key=key,
                )
                data = race.response_data or {}
                data["idempotent"] = True
                return Response(data, status=status.HTTP_200_OK)

        return Response(response_payload, status=status.HTTP_200_OK)


class StudentPaiementViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsEtudiant]
    serializer_class = PaiementSerializer

    def get_queryset(self):
        return Paiement.objects.filter(
            dossier__etudiant=self.request.user
        ).select_related("liste", "dossier", "annee_universitaire")


class MauriposteDossiersView(APIView):
    """
    Endpoint métier alias: GET /api/mauriposte/dossiers/
    Retourne les paiements/lots visibles par le partenaire connecté.
    """

    permission_classes = [IsPartenaire]

    def get(self, request):
        qs = Paiement.objects.select_related(
            "liste", "dossier", "annee_universitaire"
        ).filter(
            liste__partenaire_id=request.user.id,
            statut__in=["ENVOYE", "EFFECTUE"],
        )
        if not qs.exists():
            qs = Paiement.objects.select_related(
                "liste", "dossier", "annee_universitaire"
            ).filter(
                liste__partenaire__isnull=True,
                statut__in=["ENVOYE", "EFFECTUE"],
            )
        data = PaiementSerializer(qs, many=True).data
        return Response(data)


class AdminSendMauripostView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, dossier_id: int):
        partenaire_id = request.data.get("partenaire_id")
        nombre_mois = request.data.get("nombre_mois", 1)
        if partenaire_id in ("", None):
            partenaire_id = None
        else:
            try:
                partenaire_id = int(partenaire_id)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "partenaire_id invalide."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            nombre_mois = int(nombre_mois)
        except (TypeError, ValueError):
            return Response(
                {"detail": "nombre_mois invalide (1, 2 ou 3)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if nombre_mois not in {1, 2, 3}:
            return Response(
                {"detail": "nombre_mois invalide (1, 2 ou 3)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dossier = get_object_or_404(
            DossierBourse.objects.select_related("annee_universitaire", "etudiant"),
            pk=dossier_id,
        )
        try:
            paiement, created = envoyer_dossier_a_mauripost(
                dossier=dossier,
                admin_user=request.user,
                partenaire_id=partenaire_id,
                nombre_mois=nombre_mois,
            )
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if created:
            DossierHistorique.objects.create(
                dossier=dossier,
                ancien_statut=dossier.statut,
                nouveau_statut=dossier.statut,
                commentaire=f"Dossier envoyé à Mauripost ({nombre_mois} mois, paiement #{paiement.id}).",
                auteur=request.user,
            )
        data = PaiementSerializer(paiement).data
        data["created"] = created
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
