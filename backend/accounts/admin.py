from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from accounts.models import AdministrateurProfile, EtudiantProfile, PartenaireProfile, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = ("email", "role", "is_staff", "is_active", "date_creation")
    search_fields = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Rôle", {"fields": ("role",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined", "date_creation")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role", "is_staff", "is_active"),
            },
        ),
    )
    filter_horizontal = ("groups", "user_permissions",)


@admin.register(EtudiantProfile)
class EtudiantProfileAdmin(admin.ModelAdmin):
    list_display = ("matricule", "user", "etablissement", "filiere")


@admin.register(AdministrateurProfile)
class AdministrateurProfileAdmin(admin.ModelAdmin):
    list_display = ("nom_complet", "user", "service")


@admin.register(PartenaireProfile)
class PartenaireProfileAdmin(admin.ModelAdmin):
    list_display = ("nom", "user", "type_partenaire")
