from django.contrib import admin

from referentials.models import AnneeUniversitaire


@admin.register(AnneeUniversitaire)
class AnneeUniversitaireAdmin(admin.ModelAdmin):
    list_display = ("libelle", "date_debut", "date_fin", "actif", "est_courante")
    list_filter = ("actif", "est_courante")
