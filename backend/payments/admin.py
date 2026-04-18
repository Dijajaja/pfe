from django.contrib import admin

from .models import ListeBeneficiaires, Paiement


class PaiementInline(admin.TabularInline):
    model = Paiement
    extra = 0


@admin.register(ListeBeneficiaires)
class ListeBeneficiairesAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "annee_universitaire",
        "periode",
        "date_generation",
        "partenaire",
    )
    list_filter = ("annee_universitaire",)
    inlines = [PaiementInline]


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "liste",
        "dossier",
        "montant",
        "statut",
        "date_operation",
    )
    list_filter = ("statut", "annee_universitaire")
