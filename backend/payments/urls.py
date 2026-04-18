from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminListeBeneficiairesViewSet,
    AdminPaiementViewSet,
    PartnerConfirmationView,
    PartnerListeView,
    StudentPaiementViewSet,
)

router = DefaultRouter()
router.register(
    r"admin/listes-beneficiaires",
    AdminListeBeneficiairesViewSet,
    basename="admin-listes",
)
router.register(r"admin/paiements", AdminPaiementViewSet, basename="admin-paiements")
router.register(r"me/paiements", StudentPaiementViewSet, basename="me-paiements")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "partner/listes/<uuid:reference>/",
        PartnerListeView.as_view(),
        name="partner-liste",
    ),
    path(
        "partner/paiements/confirmer/",
        PartnerConfirmationView.as_view(),
        name="partner-confirmer",
    ),
]
