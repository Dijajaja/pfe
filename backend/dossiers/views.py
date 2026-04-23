from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsAdmin
from accounts.permissions import IsEtudiant
from dossiers.models import DossierBourse, Document, MessageReclamation, Reclamation
from dossiers.permissions import (
    MessageReclamationPermission,
    ProprietaireDossierOuAdmin,
    ProprietaireReclamationOuAdmin,
)
from dossiers.serializers import (
    DocumentSerializer,
    DossierBourseSerializer,
    MessageReclamationSerializer,
    ReclamationSerializer,
)


class DossierBourseViewSet(viewsets.ModelViewSet):
    serializer_class = DossierBourseSerializer
    permission_classes = (IsAuthenticated, ProprietaireDossierOuAdmin)
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("statut", "annee_universitaire")

    def get_queryset(self):
        qs = DossierBourse.objects.select_related(
            "etudiant",
            "instructeur",
            "annee_universitaire",
        ).prefetch_related("documents", "paiements")
        user = self.request.user
        role = getattr(user, "role", None)
        if role == User.Role.ADMIN:
            return qs
        if role == User.Role.ETUDIANT:
            return qs.filter(etudiant=user)
        return qs.none()


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = (IsAuthenticated, ProprietaireDossierOuAdmin)
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("dossier",)

    def get_queryset(self):
        qs = Document.objects.select_related("dossier")
        user = self.request.user
        role = getattr(user, "role", None)
        if role == User.Role.ADMIN:
            return qs
        if role == User.Role.ETUDIANT:
            return qs.filter(dossier__etudiant=user)
        return qs.none()

class ReclamationViewSet(viewsets.ModelViewSet):
    serializer_class = ReclamationSerializer
    permission_classes = (IsAuthenticated, ProprietaireReclamationOuAdmin)
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("statut",)

    def get_queryset(self):
        qs = Reclamation.objects.prefetch_related("dossiers", "messages").all()
        user = self.request.user
        role = getattr(user, "role", None)
        if role == User.Role.ADMIN:
            return qs
        if role == User.Role.ETUDIANT:
            return qs.filter(etudiant=user)
        return qs.none()


class MessageReclamationViewSet(viewsets.ModelViewSet):
    serializer_class = MessageReclamationSerializer
    permission_classes = (IsAuthenticated, MessageReclamationPermission)
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("reclamation",)

    def get_queryset(self):
        qs = MessageReclamation.objects.select_related("reclamation", "auteur")
        user = self.request.user
        role = getattr(user, "role", None)
        if role == User.Role.ADMIN:
            return qs
        if role == User.Role.ETUDIANT:
            return qs.filter(reclamation__etudiant=user)
        return qs.none()


class AdminDossiersAliasListView(generics.ListAPIView):
    """
    Vue alias stricte admin pour /api/admin/dossiers/
    """

    permission_classes = (IsAuthenticated, IsAdmin)
    serializer_class = DossierBourseSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("statut", "annee_universitaire")
    queryset = DossierBourse.objects.select_related(
        "etudiant",
        "instructeur",
        "annee_universitaire",
    ).prefetch_related("documents", "paiements")


class AdminDossiersAliasDetailView(generics.UpdateAPIView):
    """
    Vue alias stricte admin pour PATCH /api/admin/dossiers/{id}/
    """

    permission_classes = (IsAuthenticated, IsAdmin)
    serializer_class = DossierBourseSerializer
    queryset = DossierBourse.objects.select_related(
        "etudiant",
        "instructeur",
        "annee_universitaire",
    ).prefetch_related("documents", "paiements")


class EtudiantEligibiliteView(APIView):
    """
    Endpoint métier alias: GET /api/etudiant/eligibilite/
    Règles simplifiées côté backend (placeholder configurable).
    """

    permission_classes = (IsAuthenticated, IsEtudiant)

    def get(self, request):
        dernier = (
            DossierBourse.objects.filter(etudiant=request.user)
            .order_by("-cree_le")
            .first()
        )
        if not dernier:
            return Response(
                {
                    "eligible": True,
                    "message": "Aucun dossier antérieur. Vous pouvez déposer une demande.",
                }
            )

        if dernier.statut == "REJETE":
            return Response(
                {
                    "eligible": True,
                    "message": "Votre dernier dossier est rejeté. Vous pouvez soumettre un nouveau dossier.",
                }
            )

        return Response(
            {
                "eligible": True,
                "message": f"Dernier dossier au statut {dernier.statut}.",
                "dernier_dossier_id": dernier.id,
            }
        )
