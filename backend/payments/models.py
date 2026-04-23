import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from dossiers.models import DossierBourse
from referentials.models import AnneeUniversitaire


class StatutPaiement(models.TextChoices):
    EN_ATTENTE = "EN_ATTENTE", "En attente"
    EN_COURS = "EN_COURS", "En cours"
    ENVOYE = "ENVOYE", "Envoyé"
    EFFECTUE = "EFFECTUE", "Effectué"
    ECHEC = "ECHEC", "Échec"


class ListeBeneficiaires(models.Model):
    reference = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    date_generation = models.DateTimeField(auto_now_add=True)
    periode = models.CharField(max_length=64, blank=True)
    annee_universitaire = models.ForeignKey(
        AnneeUniversitaire,
        on_delete=models.PROTECT,
        related_name="listes_beneficiaires",
    )
    partenaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="listes_assignees",
        limit_choices_to={"role": "PARTENAIRE"},
    )

    class Meta:
        ordering = ("-date_generation",)
        verbose_name = "liste de bénéficiaires"
        verbose_name_plural = "listes de bénéficiaires"

    def __str__(self) -> str:
        return f"Liste {self.reference} ({self.annee_universitaire})"


class Paiement(models.Model):
    liste = models.ForeignKey(
        ListeBeneficiaires,
        on_delete=models.CASCADE,
        related_name="paiements",
    )
    dossier = models.ForeignKey(
        DossierBourse,
        on_delete=models.PROTECT,
        related_name="paiements",
    )
    annee_universitaire = models.ForeignKey(
        AnneeUniversitaire,
        on_delete=models.PROTECT,
        related_name="paiements",
    )
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    statut = models.CharField(
        max_length=20,
        choices=StatutPaiement.choices,
        default=StatutPaiement.EN_ATTENTE,
    )
    date_operation = models.DateTimeField(null=True, blank=True)
    date_envoi = models.DateTimeField(null=True, blank=True)
    envoye_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="paiements_envoyes",
        limit_choices_to={"role": "ADMIN"},
    )
    reference_externe = models.CharField(max_length=128, blank=True)

    class Meta:
        ordering = ("liste", "id")
        verbose_name = "paiement"
        verbose_name_plural = "paiements"
        constraints = [
            models.UniqueConstraint(
                fields=("liste", "dossier"),
                name="uniq_paiement_liste_dossier",
            ),
        ]

    def clean(self) -> None:
        if self.dossier_id and self.annee_universitaire_id:
            if self.dossier.annee_universitaire_id != self.annee_universitaire_id:
                raise ValidationError(
                    "L'année du paiement doit être la même que celle du dossier."
                )
        if self.liste_id and self.annee_universitaire_id:
            if self.liste.annee_universitaire_id != self.annee_universitaire_id:
                raise ValidationError(
                    "L'année du paiement doit correspondre à la liste."
                )

    def __str__(self) -> str:
        return f"Paiement #{self.pk} — {self.montant} ({self.statut})"


class PartenaireOperationLog(models.Model):
    """
    Journal idempotent des confirmations partenaire.
    Une même clé ne doit pas produire des effets différents.
    """

    partenaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="operation_logs_partenaire",
        limit_choices_to={"role": "PARTENAIRE"},
    )
    idempotency_key = models.CharField(max_length=128)
    request_hash = models.CharField(max_length=64)
    response_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("partenaire", "idempotency_key"),
                name="uniq_partenaire_idempotency_key",
            )
        ]
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.partenaire_id}:{self.idempotency_key}"
