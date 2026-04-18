from rest_framework import serializers

from referentials.models import AnneeUniversitaire

from .models import ListeBeneficiaires, Paiement, StatutPaiement


class PaiementSerializer(serializers.ModelSerializer):
    dossier_id = serializers.IntegerField(source="dossier.id", read_only=True)
    liste_reference = serializers.UUIDField(source="liste.reference", read_only=True)

    class Meta:
        model = Paiement
        fields = (
            "id",
            "liste",
            "liste_reference",
            "dossier",
            "dossier_id",
            "annee_universitaire",
            "montant",
            "statut",
            "date_operation",
            "reference_externe",
        )
        read_only_fields = (
            "liste_reference",
            "dossier_id",
            "date_operation",
        )


class ListeBeneficiairesSerializer(serializers.ModelSerializer):
    nombre_paiements = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = ListeBeneficiaires
        fields = (
            "id",
            "reference",
            "date_generation",
            "periode",
            "annee_universitaire",
            "partenaire",
            "nombre_paiements",
        )
        read_only_fields = ("reference", "date_generation", "nombre_paiements")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get("nombre_paiements") is None:
            data["nombre_paiements"] = instance.paiements.count()
        return data


class GenererListeSerializer(serializers.Serializer):
    annee_universitaire_id = serializers.PrimaryKeyRelatedField(
        queryset=AnneeUniversitaire.objects.all()
    )
    periode = serializers.CharField(required=False, allow_blank=True, default="")
    montant_defaut = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        allow_null=True,
    )


class PartenaireConfirmationSerializer(serializers.Serializer):
    operations = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
    )

    def validate_operations(self, value):
        allowed = {c.value for c in StatutPaiement}
        for op in value:
            if "id" not in op:
                raise serializers.ValidationError("Chaque opération doit avoir un id.")
            statut = op.get("statut", StatutPaiement.EFFECTUE)
            if statut not in allowed:
                raise serializers.ValidationError(f"Statut invalide: {statut}.")
        return value
