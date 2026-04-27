from datetime import date
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from accounts.models import User
from dossiers.models import (
    DossierBourse,
    DossierHistorique,
    Document,
    MessageReclamation,
    NiveauEtude,
    Reclamation,
    StatutDossier,
)
from payments.models import Paiement, StatutPaiement
from referentials.models import AnneeUniversitaire


class DocumentSerializer(serializers.ModelSerializer):
    chemin_stockage = serializers.CharField(read_only=True)

    class Meta:
        model = Document
        fields = ("id", "dossier", "type_piece", "fichier", "nom_fichier", "chemin_stockage", "date_depot")
        read_only_fields = ("nom_fichier", "chemin_stockage", "date_depot")

    def validate_fichier(self, fichier):
        if fichier.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("La taille maximale est de 5 Mo.")
        name = fichier.name.lower()
        if not name.endswith((".pdf", ".jpg", ".jpeg", ".png")):
            raise serializers.ValidationError("Formats acceptés : PDF, JPG, PNG.")
        return fichier


class DossierBourseSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    statut_paiement = serializers.SerializerMethodField()
    workflow_statut = serializers.SerializerMethodField()
    annee_universitaire = serializers.PrimaryKeyRelatedField(
        queryset=AnneeUniversitaire.objects.filter(actif=True),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = DossierBourse
        fields = (
            "id",
            "etudiant",
            "instructeur",
            "annee_universitaire",
            "statut",
            "statut_paiement",
            "workflow_statut",
            "date_soumission",
            "niveau",
            "numero_cni",
            "telephone",
            "commentaire_admin",
            "montant_bourse",
            "cree_le",
            "modifie_le",
            "documents",
        )
        read_only_fields = (
            "etudiant",
            "instructeur",
            "date_soumission",
            "cree_le",
            "modifie_le",
            "documents",
        )

    def get_statut_paiement(self, obj):
        paiement = (
            Paiement.objects.filter(dossier=obj)
            .order_by("-id")
            .values_list("statut", flat=True)
            .first()
        )
        return paiement or None

    def get_workflow_statut(self, obj):
        paiement_statut = self.get_statut_paiement(obj)
        if paiement_statut == StatutPaiement.EFFECTUE:
            return "PAYE"
        if paiement_statut == StatutPaiement.ENVOYE:
            return "ENVOYE"
        return obj.statut

    def _get_or_create_default_annee(self):
        """
        Fournit une année universitaire active.
        Si aucune année active n'existe, crée/active automatiquement 2025-2026.
        """
        active = AnneeUniversitaire.objects.filter(actif=True).order_by("-date_debut").first()
        if active:
            return active

        with transaction.atomic():
            default_annee, _created = AnneeUniversitaire.objects.get_or_create(
                libelle="2025-2026",
                defaults={
                    "date_debut": date(2025, 9, 1),
                    "date_fin": date(2026, 6, 30),
                    "actif": True,
                    "est_courante": True,
                },
            )
            if not default_annee.actif or not default_annee.est_courante:
                default_annee.actif = True
                default_annee.est_courante = True
                default_annee.save(update_fields=["actif", "est_courante"])
            return default_annee

    def _montant_from_niveau(self, niveau: str) -> Decimal:
        normalized = str(niveau or "").strip().upper()
        if normalized == NiveauEtude.L3:
            return Decimal("1650.00")
        return Decimal("1350.00")

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        if getattr(user, "role", None) != User.Role.ETUDIANT:
            raise serializers.ValidationError("Seuls les étudiants peuvent créer un dossier.")
        if not validated_data.get("annee_universitaire"):
            validated_data["annee_universitaire"] = self._get_or_create_default_annee()
        validated_data["etudiant"] = user
        niveau = validated_data.get("niveau", NiveauEtude.L1)
        validated_data["montant_bourse"] = self._montant_from_niveau(niveau)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        user = request.user
        if not validated_data.get("annee_universitaire") and not instance.annee_universitaire_id:
            validated_data["annee_universitaire"] = self._get_or_create_default_annee()
        target_niveau = validated_data.get("niveau", instance.niveau)
        validated_data["montant_bourse"] = self._montant_from_niveau(target_niveau)
        new_statut = validated_data.get("statut", instance.statut)
        if user.role == User.Role.ETUDIANT:
            allowed = {StatutDossier.BROUILLON, StatutDossier.SOUMIS}
            if new_statut not in allowed:
                raise serializers.ValidationError("Transition de statut non autorisée pour l’étudiant.")
            if "commentaire_admin" in validated_data:
                validated_data.pop("commentaire_admin")
        if user.role == User.Role.ADMIN and new_statut != instance.statut:
            DossierHistorique.objects.create(
                dossier=instance,
                ancien_statut=instance.statut,
                nouveau_statut=new_statut,
                commentaire=validated_data.get("commentaire_admin", ""),
                auteur=user,
            )
            if new_statut in (StatutDossier.EN_INSTRUCTION, StatutDossier.VALIDE, StatutDossier.REJETE):
                validated_data["instructeur"] = user
        if new_statut == StatutDossier.SOUMIS and not instance.date_soumission:
            validated_data["date_soumission"] = timezone.now()
        return super().update(instance, validated_data)


class MessageReclamationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageReclamation
        fields = ("id", "reclamation", "auteur", "message", "date_envoi", "piece_jointe")
        read_only_fields = ("auteur", "date_envoi")

    def validate_reclamation(self, reclamation):
        request = self.context.get("request")
        user = request.user
        if getattr(user, "role", None) == User.Role.ETUDIANT and reclamation.etudiant_id != user.id:
            raise serializers.ValidationError("Réclamation inaccessible.")
        return reclamation

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["auteur"] = request.user
        return super().create(validated_data)


class ReclamationSerializer(serializers.ModelSerializer):
    messages = MessageReclamationSerializer(many=True, read_only=True)

    class Meta:
        model = Reclamation
        fields = (
            "id",
            "etudiant",
            "dossiers",
            "objet",
            "description",
            "statut",
            "date_creation",
            "date_maj",
            "messages",
        )
        read_only_fields = ("etudiant", "date_creation", "date_maj", "messages")

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        if getattr(user, "role", None) != User.Role.ETUDIANT:
            raise serializers.ValidationError("Seuls les étudiants peuvent créer une réclamation.")
        validated_data["etudiant"] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if getattr(request.user, "role", None) != User.Role.ADMIN:
            validated_data.pop("statut", None)
        return super().update(instance, validated_data)
