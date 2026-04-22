from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import EtudiantProfile, User


class AdminUsersImportCsvTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.mr",
            password="AdminPass123!",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        self.student = User.objects.create_user(
            email="etudiant@test.mr",
            password="StudentPass123!",
            role=User.Role.ETUDIANT,
        )

    def test_non_admin_cannot_import_csv(self):
        self.client.force_authenticate(self.student)
        file = SimpleUploadedFile(
            "etudiants.csv",
            b"email,matricule,etablissement,filiere\nx@y.mr,M1,FSJE,Info\n",
            content_type="text/csv",
        )
        response = self.client.post("/api/admin/users/import-csv/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, 403)

    def test_admin_import_csv_success(self):
        self.client.force_authenticate(self.admin)
        csv_bytes = (
            b"email,matricule,etablissement,filiere,first_name,last_name\n"
            b"a1@univ.mr,MAT001,FSJE,Informatique,Ali,One\n"
            b"a2@univ.mr,MAT002,FST,Math,Salem,Two\n"
        )
        file = SimpleUploadedFile("etudiants.csv", csv_bytes, content_type="text/csv")
        response = self.client.post("/api/admin/users/import-csv/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["imported"], 2)
        self.assertEqual(response.data["total_errors"], 0)
        self.assertTrue(User.objects.filter(email="a1@univ.mr", role=User.Role.ETUDIANT).exists())
        self.assertTrue(EtudiantProfile.objects.filter(matricule="MAT001").exists())

    def test_admin_users_list_endpoint(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/v1/users/")
        self.assertEqual(response.status_code, 200)
        # paginé
        self.assertIn("results", response.data)
