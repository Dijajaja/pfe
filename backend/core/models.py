from django.db import models


class TimeStampedModel(models.Model):
    """Modèle abstrait avec dates de création et mise à jour."""

    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
