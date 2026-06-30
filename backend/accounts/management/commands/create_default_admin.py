"""
Cree les utilisateurs par defaut (admin + partenaire) si absents.
Utilise les variables d'environnement ADMIN_EMAIL, ADMIN_PASSWORD,
PARTNER_EMAIL, PARTNER_PASSWORD.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from decouple import config


class Command(BaseCommand):
    help = "Cree les utilisateurs par defaut (admin + partenaire) si absents."

    def handle(self, *args, **options):
        User = get_user_model()

        # ── Admin CNOU ────────────────────────────────────────────────────────
        admin_email = config("ADMIN_EMAIL", default="admin@cnou.mr")
        admin_password = config("ADMIN_PASSWORD", default="Admin1234!")

        if not User.objects.filter(email=admin_email).exists():
            User.objects.create_superuser(
                email=admin_email,
                password=admin_password,
            )
            self.stdout.write(self.style.SUCCESS(f"Admin cree : {admin_email}"))
        else:
            self.stdout.write(self.style.WARNING(f"Admin existe deja : {admin_email}"))

        # ── Partenaire Mauripost ──────────────────────────────────────────────
        partner_email = config("PARTNER_EMAIL", default="mauripost@partner.mr")
        partner_password = config("PARTNER_PASSWORD", default="Partner1234!")

        if not User.objects.filter(email=partner_email).exists():
            User.objects.create_user(
                email=partner_email,
                password=partner_password,
                role="PARTENAIRE",
            )
            self.stdout.write(self.style.SUCCESS(f"Partenaire cree : {partner_email}"))
        else:
            self.stdout.write(self.style.WARNING(f"Partenaire existe deja : {partner_email}"))
