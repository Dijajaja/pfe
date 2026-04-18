from django.urls import include, path
from rest_framework.routers import DefaultRouter

from dossiers.views import (
    DocumentViewSet,
    DossierBourseViewSet,
    MessageReclamationViewSet,
    ReclamationViewSet,
)

router = DefaultRouter()
router.register("dossiers", DossierBourseViewSet, basename="dossier-bourse")
router.register("documents", DocumentViewSet, basename="document")
router.register("reclamations", ReclamationViewSet, basename="reclamation")
router.register("messages-reclamations", MessageReclamationViewSet, basename="message-reclamation")

urlpatterns = [
    path("", include(router.urls)),
]
