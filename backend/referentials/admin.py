from django.contrib import admin

from referentials.models import AnneeUniversitaire, EtudiantReference


@admin.register(AnneeUniversitaire)
class AnneeUniversitaireAdmin(admin.ModelAdmin):
    list_display = ("libelle", "date_debut", "date_fin", "actif", "est_courante")
    list_filter = ("actif", "est_courante")


@admin.register(EtudiantReference)
class EtudiantReferenceAdmin(admin.ModelAdmin):
    list_display = ("matricule", "nni", "nom_complet", "etablissement", "annee_courante", "est_eligible")
    list_filter = ("est_eligible", "etablissement", "annee_courante")
    search_fields = ("nni", "matricule", "nom_complet")
