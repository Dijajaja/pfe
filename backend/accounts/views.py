from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.serializers import InscriptionEtudiantSerializer, UserSerializer


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
