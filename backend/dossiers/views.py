import uuid
from datetime import date

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsAdmin
from accounts.permissions import IsEtudiant
from dossiers.models import (
    DossierBourse,
    Document,
    MessageReclamation,
    PaiementAttestation,
    Reclamation,
    StatutDossier,
    StatutReclamation,
)
from payments.models import Paiement, StatutPaiement
from dossiers.permissions import (
    MessageReclamationPermission,
    ProprietaireDossierOuAdmin,
    ProprietaireReclamationOuAdmin,
)
from dossiers.serializers import (
    AttestationPaiementSerializer,
    BoursierListSerializer,
    DocumentSerializer,
    DossierBourseSerializer,
    MessageReclamationSerializer,
    ReclamationSerializer,
)

ATTESTATION_MONTANT = 50
ATTESTATION_CODE_COMMERCANT = "006140"


def _calc_age_years(value):
    if not value:
        return None
    try:
        birth = date.fromisoformat(str(value))
    except ValueError:
        return None
    today = date.today()
    years = today.year - birth.year
    if (today.month, today.day) < (birth.month, birth.day):
        years -= 1
    return years


def _normalize_wilaya(value):
    return str(value or "").strip().lower()


def _eligibility_payload(data):
    age = _calc_age_years(data.get("date_naissance"))
    if age is None:
        return {"ok": False, "code": "DATE_INVALIDE", "i18nKey": "eligMsgDateInvalide"}
    if age >= 24:
        return {
            "ok": False,
            "code": "AGE",
            "i18nKey": "eligMsgAge",
            "i18nParams": {"years": 24},
        }

    wilaya = _normalize_wilaya(data.get("wilaya_bac"))
    if not wilaya:
        return {
            "ok": False,
            "code": "WILAYA_MANQUANTE",
            "i18nKey": "eligMsgWilayaManquante",
        }

    niveau = str(data.get("niveau") or "").strip().upper().replace(" ", "")
    if wilaya != "nouakchott":
        return {"ok": True, "code": "HORS_NOUAKCHOTT", "i18nKey": "eligMsgHorsNkc"}
    if niveau == "L3":
        return {"ok": True, "code": "NOUAKCHOTT_L3", "i18nKey": "eligMsgNkcL3"}
    return {
        "ok": False,
        "code": "NOUAKCHOTT_PAS_L3",
        "i18nKey": "eligMsgNkcPasL3",
    }


class DossierBourseViewSet(viewsets.ModelViewSet):
    serializer_class = DossierBourseSerializer
    permission_classes = (IsAuthenticated, ProprietaireDossierOuAdmin)
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("statut", "annee_universitaire")

    def get_queryset(self):
        qs = DossierBourse.objects.select_related(
            "etudiant",
            "etudiant__profil_etudiant",
            "instructeur",
            "annee_universitaire",
        ).prefetch_related("documents", "paiements")
        user = self.request.user
        role = getattr(user, "role", None)
        if role == User.Role.ADMIN:
            return qs
        if role == User.Role.ETUDIANT:
            return qs.filter(etudiant=user)
        return qs.none()


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = (IsAuthenticated, ProprietaireDossierOuAdmin)
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("dossier",)

    def get_queryset(self):
        qs = Document.objects.select_related("dossier")
        user = self.request.user
        role = getattr(user, "role", None)
        if role == User.Role.ADMIN:
            return qs
        if role == User.Role.ETUDIANT:
            return qs.filter(dossier__etudiant=user)
        return qs.none()

class ReclamationViewSet(viewsets.ModelViewSet):
    serializer_class = ReclamationSerializer
    permission_classes = (IsAuthenticated, ProprietaireReclamationOuAdmin)
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("statut",)

    def perform_destroy(self, instance):
        user = self.request.user
        if getattr(user, "role", None) == User.Role.ETUDIANT:
            if instance.statut != StatutReclamation.SOUMISE:
                raise ValidationError(
                    "Seules les réclamations encore « soumises » (non prises en charge) peuvent être supprimées."
                )
        instance.delete()

    def get_queryset(self):
        qs = Reclamation.objects.select_related("etudiant").prefetch_related("dossiers", "messages").all()
        user = self.request.user
        role = getattr(user, "role", None)
        if role == User.Role.ADMIN:
            return qs
        if role == User.Role.ETUDIANT:
            return qs.filter(etudiant=user)
        return qs.none()


class MessageReclamationViewSet(viewsets.ModelViewSet):
    serializer_class = MessageReclamationSerializer
    permission_classes = (IsAuthenticated, MessageReclamationPermission)
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("reclamation",)

    def get_queryset(self):
        qs = MessageReclamation.objects.select_related("reclamation", "auteur")
        user = self.request.user
        role = getattr(user, "role", None)
        if role == User.Role.ADMIN:
            return qs
        if role == User.Role.ETUDIANT:
            return qs.filter(reclamation__etudiant=user)
        return qs.none()


class AdminDossiersAliasListView(generics.ListAPIView):
    """
    Vue alias stricte admin pour /api/admin/dossiers/
    """

    permission_classes = (IsAuthenticated, IsAdmin)
    serializer_class = DossierBourseSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("statut", "annee_universitaire")
    queryset = DossierBourse.objects.select_related(
        "etudiant",
        "etudiant__profil_etudiant",
        "instructeur",
        "annee_universitaire",
    ).prefetch_related("documents", "paiements")


class AdminDossiersAliasDetailView(generics.UpdateAPIView):
    """
    Vue alias stricte admin pour PATCH /api/admin/dossiers/{id}/
    """

    permission_classes = (IsAuthenticated, IsAdmin)
    serializer_class = DossierBourseSerializer
    queryset = DossierBourse.objects.select_related(
        "etudiant",
        "etudiant__profil_etudiant",
        "instructeur",
        "annee_universitaire",
    ).prefetch_related("documents", "paiements")


class AdminBoursiersListView(generics.ListAPIView):
    """
    GET /api/admin/boursiers/ — dossiers validés (boursiers) avec statut paiement Mauripost.
    Filtres : ?etablissement=ISCAE&annee_universitaire=1
    """

    permission_classes = (IsAuthenticated, IsAdmin)
    serializer_class = BoursierListSerializer

    def get_queryset(self):
        qs = (
            DossierBourse.objects.filter(statut=StatutDossier.VALIDE)
            .select_related("etudiant", "etudiant__profil_etudiant", "annee_universitaire")
            .order_by("-modifie_le", "-id")
        )
        etablissement = (self.request.query_params.get("etablissement") or "").strip()
        if etablissement:
            qs = qs.filter(etudiant__profil_etudiant__etablissement__iexact=etablissement)
        annee = self.request.query_params.get("annee_universitaire")
        if annee:
            qs = qs.filter(annee_universitaire_id=annee)
        return qs


class EtudiantEligibiliteView(APIView):
    """
    Endpoint métier alias: GET /api/etudiant/eligibilite/
    Règles simplifiées côté backend (placeholder configurable).
    """

    permission_classes = (IsAuthenticated, IsEtudiant)

    def get(self, request):
        dernier = (
            DossierBourse.objects.filter(etudiant=request.user)
            .order_by("-cree_le")
            .first()
        )
        if not dernier:
            return Response(
                {
                    "eligible": True,
                    "message": "Aucun dossier antérieur. Vous pouvez déposer une demande.",
                }
            )

        if dernier.statut == "REJETE":
            return Response(
                {
                    "eligible": True,
                    "message": "Votre dernier dossier est rejeté. Vous pouvez soumettre un nouveau dossier.",
                }
            )

        return Response(
            {
                "eligible": True,
                "message": f"Dernier dossier au statut {dernier.statut}.",
                "dernier_dossier_id": dernier.id,
            }
        )


def _latest_student_dossier(user):
    return (
        DossierBourse.objects.filter(etudiant=user)
        .select_related("annee_universitaire", "etudiant__profil_etudiant")
        .order_by("-modifie_le", "-id")
        .first()
    )


def _virement_mauripost_confirme(dossier):
    if not dossier:
        return False
    return Paiement.objects.filter(dossier=dossier, statut=StatutPaiement.EFFECTUE).exists()


def _latest_paiement_statut(dossier):
    if not dossier:
        return None
    return (
        Paiement.objects.filter(dossier=dossier)
        .order_by("-id")
        .values_list("statut", flat=True)
        .first()
    )


def _attestation_payload(user, dossier):
    profile = getattr(user, "profil_etudiant", None)
    annee = getattr(dossier, "annee_universitaire", None) if dossier else None
    paiement_att = None
    if dossier:
        paiement_att = (
            PaiementAttestation.objects.filter(dossier=dossier, etudiant=user)
            .order_by("-paye_le")
            .first()
        )
    statut_dossier = dossier.statut if dossier else None
    statut_paiement = _latest_paiement_statut(dossier)
    dossier_valide = statut_dossier == StatutDossier.VALIDE
    virement_confirme = statut_paiement == StatutPaiement.EFFECTUE
    paiement_attestation = paiement_att is not None
    eligible = dossier_valide and virement_confirme
    return {
        "eligible": eligible,
        "statut_dossier": statut_dossier,
        "statut_paiement": statut_paiement,
        "dossier_valide": dossier_valide,
        "virement_confirme": virement_confirme,
        "paiement_attestation": paiement_attestation,
        "montant_attestation": ATTESTATION_MONTANT,
        "code_commercant": ATTESTATION_CODE_COMMERCANT,
        "dossier_id": dossier.id if dossier else None,
        "attestation": {
            "reference": paiement_att.reference if paiement_att else None,
            "paye_le": paiement_att.paye_le.isoformat() if paiement_att else None,
            "methode": paiement_att.methode if paiement_att else None,
        },
        "etudiant": {
            "nom_complet": (
                f"{getattr(profile, 'prenom', '') or ''} {getattr(profile, 'nom', '') or ''}".strip()
                or f"{user.first_name or ''} {user.last_name or ''}".strip()
                or user.email
            ),
            "email": user.email,
            "nni": (dossier.numero_cni if dossier else "") or "",
            "etablissement": getattr(profile, "etablissement", "") or "",
            "filiere": getattr(profile, "filiere", "") or "",
            "matricule": getattr(profile, "matricule", "") or "",
        },
        "dossier": {
            "niveau": dossier.niveau if dossier else "",
            "montant_bourse": str(dossier.montant_bourse) if dossier else "0",
            "annee_universitaire": getattr(annee, "libelle", "") if annee else "",
            "statut": dossier.statut if dossier else "",
        },
    }


class EtudiantAttestationStatusView(APIView):
    """GET /api/etudiant/attestation/ — éligibilité et état du paiement attestation."""

    permission_classes = (IsEtudiant,)

    def get(self, request):
        dossier = _latest_student_dossier(request.user)
        return Response(_attestation_payload(request.user, dossier))


class EtudiantAttestationPaiementView(APIView):
    """POST /api/etudiant/attestation/paiement/ — confirmer le paiement 50 MRU."""

    permission_classes = (IsEtudiant,)

    def post(self, request):
        dossier = _latest_student_dossier(request.user)
        if not dossier:
            return Response({"detail": "Aucun dossier trouvé."}, status=status.HTTP_404_NOT_FOUND)
        if dossier.statut != StatutDossier.VALIDE:
            return Response(
                {"detail": "Votre dossier doit être validé par le CNOU."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not _virement_mauripost_confirme(dossier):
            return Response(
                {"detail": "Le virement Mauripost doit être confirmé avant l'attestation."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if PaiementAttestation.objects.filter(dossier=dossier, etudiant=request.user).exists():
            return Response(
                {"detail": "Le paiement attestation a déjà été enregistré.", "already_paid": True},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ser = AttestationPaiementSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ref = f"ATT-{dossier.id}-{uuid.uuid4().hex[:8].upper()}"
        paiement = PaiementAttestation.objects.create(
            dossier=dossier,
            etudiant=request.user,
            methode=ser.validated_data["methode"],
            telephone=ser.validated_data["telephone"],
            code_transaction=ser.validated_data["code_transaction"],
            montant=ATTESTATION_MONTANT,
            reference=ref,
        )
        payload = _attestation_payload(request.user, dossier)
        payload["success"] = True
        payload["message"] = "Paiement confirmé. Vous pouvez imprimer votre attestation."
        payload["attestation"]["reference"] = paiement.reference
        payload["attestation"]["paye_le"] = paiement.paye_le.isoformat()
        payload["attestation"]["methode"] = paiement.methode
        return Response(payload, status=status.HTTP_201_CREATED)


class PublicEligibiliteView(APIView):
    """
    Endpoint public pour la page de vérification:
    POST /api/public/eligibilite/
    Corps: { "nni": "...", "matricule": "..." }
    """

    permission_classes = (AllowAny,)

    def post(self, request):
        from referentials.eligibility_reference import lookup_etudiant_reference

        data = request.data or {}
        payload = lookup_etudiant_reference(
            nni=data.get("nni"),
            matricule=data.get("matricule"),
        )
        return Response(payload)
