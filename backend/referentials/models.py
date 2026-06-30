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


class EtudiantReference(models.Model):
    """Référentiel CNOU : vérification NNI + matricule avant création de compte."""

    nni = models.CharField(max_length=20, unique=True, db_index=True)
    matricule = models.CharField(max_length=64, unique=True, db_index=True)
    nom_complet = models.CharField(max_length=255)
    etablissement = models.CharField(max_length=255)
    formation = models.CharField(max_length=255)
    annee_courante = models.CharField(max_length=16)
    wilaya = models.CharField("wilaya", max_length=120, blank=True, default="")
    date_naissance = models.DateField("date de naissance", null=True, blank=True)
    est_eligible = models.BooleanField(default=False)
    motif_non_eligibilite = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        verbose_name = "référence étudiant"
        verbose_name_plural = "références étudiants"
        ordering = ("matricule",)

    def __str__(self) -> str:
        return f"{self.matricule} — {self.nom_complet}"
