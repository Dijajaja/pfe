from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from dossiers.models import DossierBourse, StatutDossier
from referentials.models import AnneeUniversitaire

from .models import ListeBeneficiaires, Paiement, StatutPaiement


@transaction.atomic
def generer_liste_beneficiaires(
    *,
    annee: AnneeUniversitaire,
    periode: str = "",
    montant_defaut: Decimal | None = None,
) -> ListeBeneficiaires:
    dossiers = DossierBourse.objects.filter(
        annee_universitaire=annee,
        statut=StatutDossier.VALIDE,
    ).select_related("etudiant", "annee_universitaire")

    liste = ListeBeneficiaires.objects.create(
        annee_universitaire=annee,
        periode=periode or "",
    )

    paiements: list[Paiement] = []
    for dossier in dossiers:
        montant = (
            montant_defaut
            if montant_defaut is not None
            else dossier.montant_bourse
        )
        if montant <= 0:
            continue
        p = Paiement(
            liste=liste,
            dossier=dossier,
            annee_universitaire=annee,
            montant=montant,
            statut=StatutPaiement.EN_ATTENTE,
        )
        p.full_clean()
        paiements.append(p)

    Paiement.objects.bulk_create(paiements)
    return liste


def confirmer_paiements(
    *,
    updates: list[dict],
    utilisateur_partenaire_id: int | None = None,
) -> tuple[int, list[str]]:
    errors: list[str] = []
    count = 0
    now = timezone.now()

    for item in updates:
        pk = item.get("id")
        if pk is None:
            errors.append("Entrée sans id ignorée.")
            continue
        try:
            pk = int(pk)
        except (TypeError, ValueError):
            errors.append(f"Identifiant de paiement invalide: {item.get('id')!r}.")
            continue
        try:
            p = Paiement.objects.select_related("liste").get(pk=pk)
        except Paiement.DoesNotExist:
            errors.append(f"Paiement {pk} introuvable.")
            continue

        if utilisateur_partenaire_id is not None:
            assignee = p.liste.partenaire_id
            if assignee and assignee != utilisateur_partenaire_id:
                errors.append(f"Paiement {pk} : liste non assignée à ce partenaire.")
                continue

        statut = item.get("statut") or StatutPaiement.EFFECTUE
        allowed = {c.value for c in StatutPaiement}
        if statut not in allowed:
            errors.append(f"Paiement {pk} : statut invalide.")
            continue

        ref = item.get("reference_externe") or ""

        if p.statut == StatutPaiement.EFFECTUE and statut == StatutPaiement.EFFECTUE:
            if ref and p.reference_externe and p.reference_externe != ref:
                errors.append(f"Paiement {pk} : déjà effectué avec une autre référence.")
            count += 1
            continue

        p.statut = statut
        p.reference_externe = ref or p.reference_externe
        if statut == StatutPaiement.EFFECTUE:
            p.date_operation = now
        p.full_clean()
        p.save(update_fields=["statut", "reference_externe", "date_operation"])
        count += 1

    return count, errors
