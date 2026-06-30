"""
Cree un superutilisateur admin par defaut si aucun n'existe.
Utilise les variables d'environnement ADMIN_EMAIL et ADMIN_PASSWORD.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from decouple import config


class Command(BaseCommand):
    help = "Cree un superutilisateur admin par defaut si aucun n'existe."

    def handle(self, *args, **options):
        User = get_user_model()
        email = config("ADMIN_EMAIL", default="admin@cnou.mr")
        password = config("ADMIN_PASSWORD", default="Admin1234!")

        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.WARNING("Admin existe deja, skip."))
            return

        User.objects.create_superuser(
            email=email,
            password=password,
        )
        self.stdout.write(self.style.SUCCESS(f"Superutilisateur cree : {email}"))
