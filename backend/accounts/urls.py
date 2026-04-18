from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import InscriptionEtudiantView, MoiView

urlpatterns = [
    path("inscription/", InscriptionEtudiantView.as_view(), name="auth-inscription-etudiant"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("moi/", MoiView.as_view(), name="auth-moi"),
]
