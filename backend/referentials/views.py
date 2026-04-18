from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from accounts.models import User
from accounts.permissions import IsAdmin
from referentials.models import AnneeUniversitaire
from referentials.serializers import AnneeUniversitaireSerializer


class AnneeUniversitaireViewSet(viewsets.ModelViewSet):
    """
    Lecture : années actives pour tout le monde (y compris inscription).
    Écriture : administrateur CNOU uniquement.
    """

    queryset = AnneeUniversitaire.objects.all()
    serializer_class = AnneeUniversitaireSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("actif", "est_courante")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = AnneeUniversitaire.objects.all()
        user = getattr(self.request, "user", None)
        if user and user.is_authenticated and getattr(user, "role", None) == User.Role.ADMIN:
            return qs
        return qs.filter(actif=True)
