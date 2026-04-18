from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.models import User
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
        ).prefetch_related("documents")
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
