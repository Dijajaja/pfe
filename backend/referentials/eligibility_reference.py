"""Vérification d'identité et d'éligibilité via le référentiel CNOU."""

from datetime import date

from referentials.models import EtudiantReference

NOT_FOUND_MESSAGE = (
    "Étudiant introuvable. Vérifiez votre NNI et votre matricule ou contactez votre établissement."
)

# Wilayas de Nouakchott (les 3 subdivisions administratives)
_NOUAKCHOTT_WILAYAS = frozenset({
    "nouakchott",
    "nouakchott nord",
    "nouakchott ouest",
    "nouakchott sud",
})

AGE_MAX = 23  # âge >= 24 → non éligible (la bourse est réservée aux moins de 24 ans)


def _normalize_nni(value):
    return "".join(ch for ch in str(value or "").strip() if ch.isdigit())


def _normalize_matricule(value):
    return str(value or "").strip().upper()


def _normalize_wilaya(value: str) -> str:
    return str(value or "").strip().lower()


def _compute_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _compute_eligibility(ref: EtudiantReference) -> tuple[bool, str]:
    """
    Règles CNOU :
    1. âge ≥ 24 ans → non éligible (réservé aux moins de 24 ans)
    2. wilaya = Nouakchott ET niveau ≠ L3 → non éligible
    3. wilaya = Nouakchott ET niveau = L3 ET âge < 24 → éligible
    4. wilaya ≠ Nouakchott ET âge < 24 → éligible
    """
    # --- Vérification de l'âge ---
    if ref.date_naissance is None:
        return False, "Date de naissance non renseignée dans le référentiel."

    age = _compute_age(ref.date_naissance)
    if age > AGE_MAX:
        return (
            False,
            f"Âge non conforme ({age} ans) : la bourse est réservée aux étudiants "
            f"de moins de 24 ans.",
        )

    # --- Vérification wilaya ---
    wilaya_norm = _normalize_wilaya(ref.wilaya)
    niveau = (ref.annee_courante or "").strip().upper()
    is_nouakchott = wilaya_norm in _NOUAKCHOTT_WILAYAS

    if is_nouakchott and niveau != "L3":
        return (
            False,
            f"Wilaya de Nouakchott : éligibilité réservée au niveau L3 "
            f"(niveau actuel : {ref.annee_courante or '?'}).",
        )

    # Nouakchott + L3 + âge < 24, ou hors Nouakchott + âge < 24
    return True, "Félicitations, vous êtes éligible à la bourse. Vous pouvez créer votre compte."


def _student_payload(ref: EtudiantReference) -> dict:
    return {
        "nni": ref.nni,
        "matricule": ref.matricule,
        "nom_complet": ref.nom_complet,
        "etablissement": ref.etablissement,
        "formation": ref.formation,
        "annee_courante": ref.annee_courante,
        "wilaya": ref.wilaya,
        "date_naissance": ref.date_naissance.isoformat() if ref.date_naissance else None,
    }


def lookup_etudiant_reference(*, nni, matricule):
    """
    Recherche (NNI + matricule) dans EtudiantReference.
    Retourne un dict prêt pour Response API.
    """
    nni_norm = _normalize_nni(nni)
    matricule_norm = _normalize_matricule(matricule)

    if not nni_norm or not matricule_norm:
        return {
            "found": False,
            "ok": False,
            "eligible": False,
            "code": "CHAMPS_MANQUANTS",
            "message": NOT_FOUND_MESSAGE,
        }

    ref = EtudiantReference.objects.filter(nni=nni_norm, matricule__iexact=matricule_norm).first()
    if ref is None:
        return {
            "found": False,
            "ok": False,
            "eligible": False,
            "code": "NOT_FOUND",
            "message": NOT_FOUND_MESSAGE,
        }

    etudiant = _student_payload(ref)
    eligible, motif = _compute_eligibility(ref)

    if eligible:
        return {
            "found": True,
            "ok": True,
            "eligible": True,
            "code": "ELIGIBLE",
            "message": motif,
            "etudiant": etudiant,
        }

    return {
        "found": True,
        "ok": False,
        "eligible": False,
        "code": "NON_ELIGIBLE",
        "message": motif,
        "motif": motif,
        "etudiant": etudiant,
    }


def split_nom_complet(nom_complet: str) -> tuple[str, str]:
    parts = (nom_complet or "").strip().split(None, 1)
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[1]
