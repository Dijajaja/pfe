from django.urls import path

from core.views import HealthLiveView, HealthReadyView

urlpatterns = [
    path("health/live", HealthLiveView.as_view(), name="health-live"),
    path("health/ready", HealthReadyView.as_view(), name="health-ready"),
]

