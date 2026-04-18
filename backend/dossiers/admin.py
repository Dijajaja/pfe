from django.contrib import admin

from dossiers.models import (
    Document,
    DossierBourse,
    DossierHistorique,
    MessageReclamation,
    Reclamation,
)


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0


@admin.register(DossierBourse)
class DossierBourseAdmin(admin.ModelAdmin):
    list_display = ("id", "etudiant", "annee_universitaire", "statut", "date_soumission", "cree_le")
    list_filter = ("statut", "annee_universitaire")
    search_fields = ("etudiant__email",)
    inlines = (DocumentInline,)


@admin.register(Reclamation)
class ReclamationAdmin(admin.ModelAdmin):
    list_display = ("id", "objet", "etudiant", "statut", "date_creation")
    list_filter = ("statut",)
    filter_horizontal = ("dossiers",)


@admin.register(MessageReclamation)
class MessageReclamationAdmin(admin.ModelAdmin):
    list_display = ("id", "reclamation", "auteur", "date_envoi")


@admin.register(DossierHistorique)
class DossierHistoriqueAdmin(admin.ModelAdmin):
    list_display = ("dossier", "ancien_statut", "nouveau_statut", "auteur", "date_action")
