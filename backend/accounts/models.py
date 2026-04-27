from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("L’adresse e-mail est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "ADMIN")
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser doit avoir is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Utilisateur applicatif : email comme identifiant, rôle RBAC."""

    class Role(models.TextChoices):
        ETUDIANT = "ETUDIANT", "Étudiant"
        ADMIN = "ADMIN", "Administrateur CNOU"
        PARTENAIRE = "PARTENAIRE", "Partenaire"

    username = None
    email = models.EmailField("adresse e-mail", unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ETUDIANT)
    date_creation = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        verbose_name = "utilisateur"
        verbose_name_plural = "utilisateurs"

    def __str__(self) -> str:
        return self.email


class EtudiantProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profil_etudiant",
    )
    matricule = models.CharField(max_length=64, unique=True)
    etablissement = models.CharField(max_length=255)
    filiere = models.CharField(max_length=255)
    wilaya = models.CharField(max_length=120, blank=True, default="")

    class Meta:
        verbose_name = "profil étudiant"

    def __str__(self) -> str:
        return f"{self.matricule} ({self.user.email})"


class AdministrateurProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profil_administrateur",
    )
    service = models.CharField(max_length=255)
    nom_complet = models.CharField(max_length=255)

    class Meta:
        verbose_name = "profil administrateur"

    def __str__(self) -> str:
        return self.nom_complet


class PartenaireProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profil_partenaire",
    )
    nom = models.CharField(max_length=255)
    type_partenaire = models.CharField(max_length=100)

    class Meta:
        verbose_name = "profil partenaire"

    def __str__(self) -> str:
        return self.nom
