from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from accounts.models import User
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

        if statut == StatutPaiement.EFFECTUE and p.statut not in (
            StatutPaiement.ENVOYE,
            StatutPaiement.EFFECTUE,
        ):
            errors.append(f"Paiement {pk} : non envoyé par CNOU.")
            continue

        p.statut = statut
        p.reference_externe = ref or p.reference_externe
        if statut == StatutPaiement.EFFECTUE:
            p.date_operation = now
        p.full_clean()
        p.save(update_fields=["statut", "reference_externe", "date_operation"])
        count += 1

    return count, errors


def choisir_partenaire_mauripost(partenaire_id: int | None = None) -> User:
    qs = User.objects.filter(role=User.Role.PARTENAIRE, is_active=True).order_by("id")
    if partenaire_id is not None:
        try:
            return qs.get(id=partenaire_id)
        except User.DoesNotExist as exc:
            raise ValidationError("Partenaire introuvable.") from exc

    preferred = qs.filter(email__icontains="mauripost").first()
    if preferred:
        return preferred
    fallback = qs.first()
    if fallback:
        return fallback
    raise ValidationError("Aucun partenaire actif disponible.")


@transaction.atomic
def envoyer_dossier_a_mauripost(
    *,
    dossier: DossierBourse,
    admin_user: User,
    partenaire_id: int | None = None,
    nombre_mois: int = 1,
) -> tuple[Paiement, bool]:
    if dossier.statut != StatutDossier.VALIDE:
        raise ValidationError("Seuls les dossiers validés peuvent être envoyés.")
    if nombre_mois not in {1, 2, 3}:
        raise ValidationError("Le nombre de mois doit être 1, 2 ou 3.")

    partenaire = choisir_partenaire_mauripost(partenaire_id)
    existing = (
        Paiement.objects.select_related("liste")
        .filter(dossier=dossier, liste__partenaire=partenaire)
        .order_by("-id")
        .first()
    )
    if existing:
        return existing, False

    montant_mensuel = dossier.montant_bourse
    montant = montant_mensuel * Decimal(nombre_mois)
    if montant <= 0:
        raise ValidationError("Montant de bourse invalide pour créer un paiement.")

    liste = ListeBeneficiaires.objects.create(
        annee_universitaire=dossier.annee_universitaire,
        partenaire=partenaire,
        periode=f"Envoi CNOU {timezone.localdate().isoformat()} ({nombre_mois} mois)",
    )
    paiement = Paiement(
        liste=liste,
        dossier=dossier,
        annee_universitaire=dossier.annee_universitaire,
        montant=montant,
        statut=StatutPaiement.ENVOYE,
        date_envoi=timezone.now(),
        envoye_par=admin_user,
    )
    paiement.full_clean()
    paiement.save()
    return paiement, True
