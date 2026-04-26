from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from dossiers.models import DossierBourse, StatutDossier
from referentials.models import AnneeUniversitaire


class RbacAliasEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.annee = AnneeUniversitaire.objects.create(
            libelle="2025-2026",
            date_debut="2025-10-01",
            date_fin="2026-07-31",
            actif=True,
            est_courante=True,
        )
        self.admin = User.objects.create_user(
            email="admin@rbac.mr",
            password="AdminPass123!",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        self.etudiant = User.objects.create_user(
            email="etu@rbac.mr",
            password="EtuPass123!",
            role=User.Role.ETUDIANT,
        )
        self.partenaire = User.objects.create_user(
            email="partner@rbac.mr",
            password="PartnerPass123!",
            role=User.Role.PARTENAIRE,
        )
        self.dossier = DossierBourse.objects.create(
            etudiant=self.etudiant,
            annee_universitaire=self.annee,
            statut=StatutDossier.SOUMIS,
            montant_bourse=1000,
        )

    def test_admin_can_access_admin_dossiers_alias(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/admin/dossiers/")
        self.assertEqual(response.status_code, 200)

    def test_etudiant_cannot_access_admin_dossiers_alias(self):
        self.client.force_authenticate(self.etudiant)
        response = self.client.get("/api/admin/dossiers/")
        self.assertEqual(response.status_code, 403)

    def test_etudiant_can_access_eligibilite_alias(self):
        self.client.force_authenticate(self.etudiant)
        response = self.client.get("/api/etudiant/eligibilite/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("eligible", response.data)

    def test_admin_cannot_access_eligibilite_alias(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/etudiant/eligibilite/")
        self.assertEqual(response.status_code, 403)

    def test_public_eligibilite_endpoint_returns_result(self):
        response = self.client.post(
            "/api/public/eligibilite/",
            {
                "nni": "1234567890",
                "date_naissance": "2005-01-10",
                "wilaya_bac": "Nouakchott",
                "niveau": "L2",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("ok", response.data)
        self.assertIn("i18nKey", response.data)
        self.assertEqual(response.data["ok"], False)
        self.assertEqual(response.data["i18nKey"], "eligMsgNkcPasL3")
