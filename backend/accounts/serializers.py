from django.contrib.auth.password_validation import validate_password
from django.db import IntegrityError, transaction
from rest_framework import serializers

from accounts.models import EtudiantProfile, User


class EtudiantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtudiantProfile
        fields = ("matricule", "etablissement", "filiere")


class UserSerializer(serializers.ModelSerializer):
    profil_etudiant = EtudiantProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "role", "date_creation", "first_name", "last_name", "profil_etudiant")
        read_only_fields = fields


class InscriptionEtudiantSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    matricule = serializers.CharField(max_length=64)
    etablissement = serializers.CharField(max_length=255)
    filiere = serializers.CharField(max_length=255)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet e-mail.")
        return value.lower()

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_matricule(self, value):
        normalized = (value or "").strip()
        if EtudiantProfile.objects.filter(matricule__iexact=normalized).exists():
            raise serializers.ValidationError("Ce matricule est déjà utilisé.")
        return normalized

    def create(self, validated_data):
        profile_data = {
            "matricule": validated_data.pop("matricule"),
            "etablissement": validated_data.pop("etablissement"),
            "filiere": validated_data.pop("filiere"),
        }
        password = validated_data.pop("password")
        try:
            with transaction.atomic():
                user = User.objects.create_user(password=password, role=User.Role.ETUDIANT, **validated_data)
                EtudiantProfile.objects.create(user=user, **profile_data)
                return user
        except IntegrityError as exc:
            message = str(exc).lower()
            if "matricule" in message:
                raise serializers.ValidationError({"matricule": ["Ce matricule est déjà utilisé."]}) from exc
            if "email" in message:
                raise serializers.ValidationError({"email": ["Un compte existe déjà avec cet e-mail."]}) from exc
            raise serializers.ValidationError("Inscription impossible pour le moment. Réessayez plus tard.") from exc


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "role",
            "is_active",
            "first_name",
            "last_name",
            "date_creation",
        )
        read_only_fields = ("id", "date_creation")


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("role", "is_active", "first_name", "last_name")

    def validate_role(self, value):
        allowed = {choice[0] for choice in User.Role.choices}
        if value not in allowed:
            raise serializers.ValidationError("Rôle invalide.")
        return value
