import secrets
import string

from django.contrib.auth.password_validation import validate_password
from django.db import IntegrityError, transaction
from rest_framework import serializers

from accounts.models import EtudiantProfile, User
from dossiers.models import DossierBourse, StatutDossier


class EtudiantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtudiantProfile
        fields = ("matricule", "etablissement", "filiere", "wilaya")


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
    wilaya = serializers.CharField(max_length=120, required=False, allow_blank=True)

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
            "wilaya": validated_data.pop("wilaya", ""),
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
    full_name = serializers.SerializerMethodField()
    matricule = serializers.SerializerMethodField()
    etablissement = serializers.SerializerMethodField()
    filiere = serializers.SerializerMethodField()
    wilaya = serializers.SerializerMethodField()
    dossier_id = serializers.SerializerMethodField()
    dossier_statut = serializers.SerializerMethodField()
    niveau = serializers.SerializerMethodField()
    is_eligible = serializers.SerializerMethodField()

    def _latest_dossier(self, obj):
        cache = self.context.setdefault("_latest_dossiers_cache", {})
        if obj.id not in cache:
            cache[obj.id] = DossierBourse.objects.filter(etudiant_id=obj.id).order_by("-cree_le").first()
        return cache[obj.id]

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
            "full_name",
            "matricule",
            "etablissement",
            "filiere",
            "wilaya",
            "dossier_id",
            "dossier_statut",
            "niveau",
            "is_eligible",
        )
        read_only_fields = ("id", "date_creation")

    def get_full_name(self, obj):
        full_name = f"{obj.first_name or ''} {obj.last_name or ''}".strip()
        return full_name or obj.email

    def get_matricule(self, obj):
        profile = getattr(obj, "profil_etudiant", None)
        return getattr(profile, "matricule", "")

    def get_etablissement(self, obj):
        profile = getattr(obj, "profil_etudiant", None)
        return getattr(profile, "etablissement", "")

    def get_filiere(self, obj):
        profile = getattr(obj, "profil_etudiant", None)
        return getattr(profile, "filiere", "")

    def get_wilaya(self, obj):
        profile = getattr(obj, "profil_etudiant", None)
        return getattr(profile, "wilaya", "")

    def get_dossier_id(self, obj):
        dossier = self._latest_dossier(obj)
        return dossier.id if dossier else None

    def get_dossier_statut(self, obj):
        dossier = self._latest_dossier(obj)
        return dossier.statut if dossier else None

    def get_niveau(self, obj):
        dossier = self._latest_dossier(obj)
        return dossier.niveau if dossier else None

    def get_is_eligible(self, obj):
        dossier = self._latest_dossier(obj)
        if not dossier:
            return None
        return dossier.statut == StatutDossier.VALIDE


class AdminStudentCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    matricule = serializers.CharField(max_length=64)
    etablissement = serializers.CharField(max_length=255)
    filiere = serializers.CharField(max_length=255)
    wilaya = serializers.CharField(max_length=120, required=False, allow_blank=True)

    def validate_email(self, value):
        email = value.lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Un utilisateur avec cet e-mail existe déjà.")
        return email

    def validate_matricule(self, value):
        matricule = (value or "").strip()
        if EtudiantProfile.objects.filter(matricule__iexact=matricule).exists():
            raise serializers.ValidationError("Ce matricule est déjà utilisé.")
        return matricule

    @staticmethod
    def generate_temporary_password(length=12):
        alphabet = string.ascii_letters + string.digits + "@$!%*?&"
        return "".join(secrets.choice(alphabet) for _ in range(length))

    def create(self, validated_data):
        temporary_password = self.generate_temporary_password()
        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data["email"],
                password=temporary_password,
                role=User.Role.ETUDIANT,
                is_active=True,
                first_name=validated_data.get("first_name", ""),
                last_name=validated_data.get("last_name", ""),
            )
            EtudiantProfile.objects.create(
                user=user,
                matricule=validated_data["matricule"],
                etablissement=validated_data["etablissement"],
                filiere=validated_data["filiere"],
                wilaya=validated_data.get("wilaya", ""),
            )
        user._temporary_password = temporary_password  # noqa: SLF001
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("role", "is_active", "first_name", "last_name")

    def validate_role(self, value):
        allowed = {choice[0] for choice in User.Role.choices}
        if value not in allowed:
            raise serializers.ValidationError("Rôle invalide.")
        return value
