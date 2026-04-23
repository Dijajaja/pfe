from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from dossiers.models import DossierBourse, StatutDossier
from payments.models import ListeBeneficiaires, Paiement, StatutPaiement
from referentials.models import AnneeUniversitaire


class PaiementsPartnerIdempotenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.annee = AnneeUniversitaire.objects.create(
            libelle="2026-2027",
            date_debut="2026-10-01",
            date_fin="2027-07-31",
            actif=True,
            est_courante=True,
        )
        self.etudiant = User.objects.create_user(
            email="etu@pay.mr",
            password="EtuPass123!",
            role=User.Role.ETUDIANT,
        )
        self.partenaire = User.objects.create_user(
            email="partner@pay.mr",
            password="PartPass123!",
            role=User.Role.PARTENAIRE,
        )
        self.admin = User.objects.create_user(
            email="admin@pay.mr",
            password="AdminPass123!",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        self.dossier = DossierBourse.objects.create(
            etudiant=self.etudiant,
            annee_universitaire=self.annee,
            statut=StatutDossier.VALIDE,
            montant_bourse=Decimal("2000.00"),
        )
        self.liste = ListeBeneficiaires.objects.create(
            annee_universitaire=self.annee,
            periode="Mars 2027",
            partenaire=self.partenaire,
        )
        self.paiement = Paiement.objects.create(
            liste=self.liste,
            dossier=self.dossier,
            annee_universitaire=self.annee,
            montant=Decimal("2000.00"),
            statut=StatutPaiement.ENVOYE,
        )

    def test_partner_can_list_mauriposte_alias(self):
        self.client.force_authenticate(self.partenaire)
        response = self.client.get("/api/mauriposte/dossiers/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_admin_cannot_list_mauriposte_alias(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/mauriposte/dossiers/")
        self.assertEqual(response.status_code, 403)

    def test_admin_can_send_validated_dossier_to_mauripost(self):
        dossier_2 = DossierBourse.objects.create(
            etudiant=self.etudiant,
            annee_universitaire=self.annee,
            statut=StatutDossier.VALIDE,
            montant_bourse=Decimal("3000.00"),
        )
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            f"/api/admin/dossiers/{dossier_2.id}/envoyer-mauripost/",
            data={},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        created = Paiement.objects.get(id=response.data["id"])
        self.assertEqual(created.statut, StatutPaiement.ENVOYE)
        self.assertEqual(created.envoye_par_id, self.admin.id)
        self.assertIsNotNone(created.date_envoi)

    def test_admin_cannot_send_non_validated_dossier(self):
        dossier_2 = DossierBourse.objects.create(
            etudiant=self.etudiant,
            annee_universitaire=self.annee,
            statut=StatutDossier.SOUMIS,
            montant_bourse=Decimal("3000.00"),
        )
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            f"/api/admin/dossiers/{dossier_2.id}/envoyer-mauripost/",
            data={},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_confirmation_idempotent_same_key_same_payload(self):
        self.client.force_authenticate(self.partenaire)
        payload = {
            "operations": [
                {
                    "id": self.paiement.id,
                    "statut": "EFFECTUE",
                    "reference_externe": "EXT-001",
                }
            ]
        }
        headers = {"HTTP_X_IDEMPOTENCY_KEY": "partner-key-1"}
        first = self.client.post("/api/mauriposte/paiement/", data=payload, format="json", **headers)
        second = self.client.post("/api/mauriposte/paiement/", data=payload, format="json", **headers)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertFalse(first.data["idempotent"])
        self.assertTrue(second.data["idempotent"])

    def test_confirmation_idempotent_conflict_for_different_payload(self):
        self.client.force_authenticate(self.partenaire)
        payload_1 = {
            "operations": [
                {"id": self.paiement.id, "statut": "EFFECTUE", "reference_externe": "EXT-001"}
            ]
        }
        payload_2 = {
            "operations": [
                {"id": self.paiement.id, "statut": "ECHEC", "reference_externe": "EXT-009"}
            ]
        }
        headers = {"HTTP_X_IDEMPOTENCY_KEY": "partner-key-2"}
        first = self.client.post("/api/mauriposte/paiement/", data=payload_1, format="json", **headers)
        second = self.client.post("/api/mauriposte/paiement/", data=payload_2, format="json", **headers)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 409)
