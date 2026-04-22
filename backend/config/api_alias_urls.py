from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import (
    AdminImportEtudiantsCsvView,
    AdminUserDetailView,
    AdminUsersListView,
    InscriptionEtudiantView,
    MoiView,
)
from dossiers.views import (
    AdminDossiersAliasDetailView,
    AdminDossiersAliasListView,
    DocumentViewSet,
    DossierBourseViewSet,
    EtudiantEligibiliteView,
)
from payments.views import MauriposteDossiersView, PartnerConfirmationView

demande_list_create = DossierBourseViewSet.as_view({"get": "list", "post": "create"})
demande_detail = DossierBourseViewSet.as_view({"get": "retrieve", "patch": "partial_update"})
document_upload = DocumentViewSet.as_view({"post": "create"})
urlpatterns = [
    # Auth alias
    path("auth/register/", InscriptionEtudiantView.as_view(), name="alias-auth-register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="alias-auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="alias-auth-refresh"),
    path("auth/me/", MoiView.as_view(), name="alias-auth-me"),
    # Étudiant alias
    path("etudiant/eligibilite/", EtudiantEligibiliteView.as_view(), name="alias-etudiant-eligibilite"),
    path("demande/", demande_list_create, name="alias-demande-list-create"),
    path("demande/<int:pk>/", demande_detail, name="alias-demande-detail"),
    path("documents/upload/", document_upload, name="alias-documents-upload"),
    # Admin CNOU alias
    path("admin/dossiers/", AdminDossiersAliasListView.as_view(), name="alias-admin-dossiers"),
    path("admin/dossiers/<int:pk>/", AdminDossiersAliasDetailView.as_view(), name="alias-admin-dossiers-patch"),
    path("admin/users/", AdminUsersListView.as_view(), name="alias-admin-users"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="alias-admin-users-detail"),
    path("admin/users/import-csv/", AdminImportEtudiantsCsvView.as_view(), name="alias-admin-users-import-csv"),
    # Mauriposte alias
    path("mauriposte/dossiers/", MauriposteDossiersView.as_view(), name="alias-mauriposte-dossiers"),
    path("mauriposte/paiement/", PartnerConfirmationView.as_view(), name="alias-mauriposte-paiement"),
]

