from django.contrib.auth.password_validation import validate_password
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

    def create(self, validated_data):
        profile_data = {
            "matricule": validated_data.pop("matricule"),
            "etablissement": validated_data.pop("etablissement"),
            "filiere": validated_data.pop("filiere"),
        }
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, role=User.Role.ETUDIANT, **validated_data)
        EtudiantProfile.objects.create(user=user, **profile_data)
        return user
