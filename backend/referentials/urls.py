from django.urls import include, path
from rest_framework.routers import DefaultRouter

from referentials.views import AnneeUniversitaireViewSet

router = DefaultRouter()
router.register("annees-universitaires", AnneeUniversitaireViewSet, basename="annee-universitaire")

urlpatterns = [
    path("", include(router.urls)),
]
