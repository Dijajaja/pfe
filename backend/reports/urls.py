from django.urls import path

from .views import AdminDashboardView, AdminExportPaiementsView

urlpatterns = [
    path(
        "admin/reports/dashboard/",
        AdminDashboardView.as_view(),
        name="admin-dashboard",
    ),
    path(
        "admin/exports/paiements.xlsx",
        AdminExportPaiementsView.as_view(),
        name="admin-export-paiements",
    ),
]
