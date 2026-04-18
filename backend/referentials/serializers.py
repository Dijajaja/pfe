from rest_framework import serializers

from referentials.models import AnneeUniversitaire


class AnneeUniversitaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnneeUniversitaire
        fields = (
            "id",
            "libelle",
            "date_debut",
            "date_fin",
            "actif",
            "est_courante",
        )
