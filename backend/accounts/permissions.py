from rest_framework import permissions

from accounts.models import User


class IsAdmin(permissions.BasePermission):
    """Accès réservé aux comptes administrateur CNOU."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == User.Role.ADMIN
        )


class IsEtudiant(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == User.Role.ETUDIANT
        )


class IsPartenaire(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == User.Role.PARTENAIRE
        )
