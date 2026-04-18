from django.db import models


class AnneeUniversitaire(models.Model):
    """Référentiel : année universitaire (filtre global, période d’ouverture)."""

    libelle = models.CharField(max_length=50, unique=True)
    date_debut = models.DateField()
    date_fin = models.DateField()
    actif = models.BooleanField(default=True)
    est_courante = models.BooleanField(
        default=False,
        help_text="Une seule année devrait être marquée comme courante.",
    )

    class Meta:
        verbose_name = "année universitaire"
        verbose_name_plural = "années universitaires"
        ordering = ("-date_debut",)

    def __str__(self) -> str:
        return self.libelle
