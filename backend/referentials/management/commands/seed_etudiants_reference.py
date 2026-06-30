from datetime import date

from django.core.management.base import BaseCommand

from referentials.models import EtudiantReference

# Règles CNOU appliquées :
# - âge ≥ 24 → non éligible (bourse réservée aux moins de 24 ans)
# - wilaya Nouakchott + niveau ≠ L3 → non éligible
# - wilaya Nouakchott + L3 + âge < 24 → éligible
# - hors Nouakchott + âge < 24 → éligible
#
# Colonnes : nni, matricule, nom_complet, etablissement, formation,
#            annee_courante, wilaya, date_naissance, est_eligible (cache)
SEED_ROWS = [
    # Éligibles — hors Nouakchott, âge < 24
    ("1000000001", "I24001", "Mohamed Ould Ahmed",
     "ISCAE", "Licence Informatique", "L3",
     "Hodh Ech Chargui", date(2003, 6, 10), True),

    ("1000000002", "I24002", "Fatimetou Mint Mohamed",
     "ISCAE", "Licence Gestion", "L2",
     "Assaba", date(2004, 1, 25), True),

    # Non éligible — Nouakchott Nord, L3, âge ≥ 24
    ("1000000003", "I24003", "Sidi Mohamed Ould Ely",
     "ISCAE", "Licence Finance", "L3",
     "Nouakchott Nord", date(2000, 3, 15), False),

    # Éligible — hors Nouakchott, âge < 24
    ("1000000004", "I24004", "Meimouna Amadou Diallo",
     "ISCAE", "Licence Comptabilité", "L2",
     "Guidimakha", date(2003, 9, 14), True),

    # Non éligible — Trarza, L3, âge ≥ 24
    ("1000000005", "I24005", "Ahmed Ould Mohamed",
     "ISCAE", "Licence Marketing", "L3",
     "Trarza", date(2000, 7, 22), False),

    # Éligibles — hors Nouakchott, âge < 24
    ("1000000006", "C24001", "Mariem Mint Salem",
     "FST", "Génie Informatique", "L2",
     "Adrar", date(2004, 3, 5), True),

    ("1000000007", "C24002", "Khadijetou Mint El Hacen",
     "FST", "Physique", "L3",
     "Inchiri", date(2003, 11, 30), True),

    # Non éligible — Tiris Zemmour, L1, âge ≥ 24
    ("1000000008", "C24003", "Mohamed Lemine Ould Cheikh",
     "FST", "Mathématiques", "L1",
     "Tiris Zemmour", date(1999, 11, 5), False),

    # Éligibles — hors Nouakchott, âge < 24
    ("1000000009", "C24004", "Aminetou Mint Yahya",
     "Université de Nouakchott Al Aasriya", "Économie", "L3",
     "Gorgol", date(2003, 7, 20), True),

    ("1000000010", "C24005", "Abdallahi Ould Mohamed",
     "Université de Nouakchott Al Aasriya", "Droit", "L2",
     "Brakna", date(2003, 4, 18), True),

    # Non éligible — Tagant, âge > 24
    ("1000000011", "B24001", "Aicha Mint Ahmed",
     "ENI", "Génie Électrique", "L2",
     "Tagant", date(2000, 5, 10), False),

    # Éligibles — hors Nouakchott, âge ≤ 24
    ("1000000012", "B24002", "Mohamed Salem Ould Amar",
     "ENI", "Génie Civil", "L3",
     "Hodh El Gharbi", date(2002, 10, 12), True),

    ("1000000013", "B24003", "Zeinebou Mint Mohamed",
     "ISET", "Réseaux Informatiques", "L2",
     "Dakhlet Nouadhibou", date(2003, 2, 28), True),

    # Non éligible — Nouakchott Ouest, L3, âge > 24
    ("1000000014", "B24004", "Cheikh Ould Sidi",
     "ENAJM", "Journalisme", "L3",
     "Nouakchott Ouest", date(2001, 1, 20), False),

    # Éligible — hors Nouakchott, âge ≤ 24
    ("1000000015", "B24005", "Mohamed Ould Boubacar",
     "ESP", "Santé Publique", "L2",
     "Hodh Ech Chargui", date(2004, 5, 17), True),
]


class Command(BaseCommand):
    help = "Charge le référentiel EtudiantReference (NNI + matricule + wilaya + date naissance)."

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for nni, matricule, nom, etab, formation, annee, wilaya, dob, eligible in SEED_ROWS:
            _, was_created = EtudiantReference.objects.update_or_create(
                nni=nni,
                defaults={
                    "matricule": matricule,
                    "nom_complet": nom,
                    "etablissement": etab,
                    "formation": formation,
                    "annee_courante": annee,
                    "wilaya": wilaya,
                    "date_naissance": dob,
                    "est_eligible": eligible,
                    "motif_non_eligibilite": "",
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(
            self.style.SUCCESS(
                f"Référentiel étudiants : {created} créé(s), {updated} mis à jour — total {len(SEED_ROWS)}."
            )
        )
