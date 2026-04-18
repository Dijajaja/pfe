from rest_framework import permissions

from accounts.models import User
from dossiers.models import DossierBourse


class ProprietaireDossierOuAdmin(permissions.BasePermission):
    """L’étudiant propriétaire du dossier (ou du document lié), ou un administrateur."""

    def _dossier(self, obj):
        return obj if isinstance(obj, DossierBourse) else obj.dossier

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False
        if getattr(user, "role", None) == User.Role.ADMIN:
            return True
        if getattr(user, "role", None) == User.Role.ETUDIANT:
            dossier = self._dossier(obj)
            return dossier.etudiant_id == user.id
        return False


class ProprietaireReclamationOuAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False
        if getattr(user, "role", None) == User.Role.ADMIN:
            return True
        if getattr(user, "role", None) == User.Role.ETUDIANT:
            return getattr(obj, "etudiant_id", None) == user.id
        return False


class MessageReclamationPermission(permissions.BasePermission):
    """Auteur du message ou admin ; création si membre de la réclamation."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False
        if getattr(user, "role", None) == User.Role.ADMIN:
            return True
        return obj.auteur_id == user.id

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
