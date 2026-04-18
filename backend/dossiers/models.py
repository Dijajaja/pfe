import os

from django.conf import settings
from django.db import models

from referentials.models import AnneeUniversitaire


def document_upload_path(instance, filename):
    return os.path.join("dossiers", str(instance.dossier_id), filename)


class StatutDossier(models.TextChoices):
    BROUILLON = "BROUILLON", "Brouillon"
    SOUMIS = "SOUMIS", "Soumis"
    EN_INSTRUCTION = "EN_INSTRUCTION", "En instruction"
    VALIDE = "VALIDE", "Validé"
    REJETE = "REJETE", "Rejeté"
    COMPLEMENT_DEMANDE = "COMPLEMENT_DEMANDE", "Complément demandé"


class StatutReclamation(models.TextChoices):
    SOUMISE = "SOUMISE", "Soumise"
    EN_COURS = "EN_COURS", "En cours"
    EN_ATTENTE_ETUDIANT = "EN_ATTENTE_ETUDIANT", "En attente étudiant"
    TRAITEE = "TRAITEE", "Traitée"
    REJETEE = "REJETEE", "Rejetée"


class DossierBourse(models.Model):
    etudiant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dossiers_bourse",
    )
    instructeur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dossiers_instruits",
    )
    annee_universitaire = models.ForeignKey(
        AnneeUniversitaire,
        on_delete=models.PROTECT,
        related_name="dossiers",
    )
    statut = models.CharField(
        max_length=30,
        choices=StatutDossier.choices,
        default=StatutDossier.BROUILLON,
    )
    date_soumission = models.DateTimeField(null=True, blank=True)
    commentaire_admin = models.TextField(blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "dossier de bourse"
        verbose_name_plural = "dossiers de bourse"
        ordering = ("-cree_le",)

    def __str__(self) -> str:
        return f"Dossier #{self.pk} — {self.etudiant_id} ({self.statut})"


class Document(models.Model):
    dossier = models.ForeignKey(
        DossierBourse,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    type_piece = models.CharField(max_length=100)
    fichier = models.FileField(upload_to=document_upload_path)
    nom_fichier = models.CharField(max_length=255, blank=True)
    date_depot = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "document"
        verbose_name_plural = "documents"

    def save(self, *args, **kwargs):
        if self.fichier and not self.nom_fichier:
            self.nom_fichier = os.path.basename(self.fichier.name)
        super().save(*args, **kwargs)

    @property
    def chemin_stockage(self) -> str:
        return self.fichier.name if self.fichier else ""

    def __str__(self) -> str:
        return self.nom_fichier or str(self.fichier)


class DossierHistorique(models.Model):
    """Historique des changements de statut (traçabilité admin / workflow)."""

    dossier = models.ForeignKey(
        DossierBourse,
        on_delete=models.CASCADE,
        related_name="historique",
    )
    ancien_statut = models.CharField(max_length=30, blank=True)
    nouveau_statut = models.CharField(max_length=30)
    commentaire = models.TextField(blank=True)
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    date_action = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "entrée d’historique dossier"
        ordering = ("-date_action",)


class Reclamation(models.Model):
    etudiant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reclamations",
    )
    dossiers = models.ManyToManyField(
        DossierBourse,
        blank=True,
        related_name="reclamations",
    )
    objet = models.CharField(max_length=255)
    description = models.TextField()
    statut = models.CharField(
        max_length=30,
        choices=StatutReclamation.choices,
        default=StatutReclamation.SOUMISE,
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_maj = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "réclamation"
        verbose_name_plural = "réclamations"
        ordering = ("-date_creation",)


class MessageReclamation(models.Model):
    reclamation = models.ForeignKey(
        Reclamation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messages_reclamation",
    )
    message = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)
    piece_jointe = models.CharField(max_length=512, blank=True)

    class Meta:
        verbose_name = "message de réclamation"
        verbose_name_plural = "messages de réclamation"
        ordering = ("date_envoi",)
