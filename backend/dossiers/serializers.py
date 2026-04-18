from django.utils import timezone
from rest_framework import serializers

from accounts.models import User
from dossiers.models import (
    DossierBourse,
    DossierHistorique,
    Document,
    MessageReclamation,
    Reclamation,
    StatutDossier,
)
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
    annee_universitaire = serializers.PrimaryKeyRelatedField(
        queryset=AnneeUniversitaire.objects.filter(actif=True),
    )

    class Meta:
        model = DossierBourse
        fields = (
            "id",
            "etudiant",
            "instructeur",
            "annee_universitaire",
            "statut",
            "date_soumission",
            "commentaire_admin",
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

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        if getattr(user, "role", None) != User.Role.ETUDIANT:
            raise serializers.ValidationError("Seuls les étudiants peuvent créer un dossier.")
        validated_data["etudiant"] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        user = request.user
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
