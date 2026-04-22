from django.urls import path

from accounts.views import AdminImportEtudiantsCsvView, AdminUserDetailView, AdminUsersListView

urlpatterns = [
    path("users/", AdminUsersListView.as_view(), name="admin-users-list"),
    path("users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-users-detail"),
    path("admin/users/import-csv/", AdminImportEtudiantsCsvView.as_view(), name="admin-users-import-csv"),
]

