"""
Cree l'annee universitaire courante 2024-2025 si aucune n'existe.
"""
from datetime import date
from django.core.management.base import BaseCommand
from referentials.models import AnneeUniversitaire


class Command(BaseCommand):
    help = "Cree l'annee universitaire courante si absente."

    def handle(self, *args, **options):
        if AnneeUniversitaire.objects.exists():
            self.stdout.write(self.style.WARNING("Annee universitaire existe deja, skip."))
            return

        AnneeUniversitaire.objects.create(
            libelle="2024-2025",
            date_debut=date(2024, 10, 1),
            date_fin=date(2025, 7, 31),
            actif=True,
            est_courante=True,
        )
        self.stdout.write(self.style.SUCCESS("Annee universitaire 2024-2025 creee."))
