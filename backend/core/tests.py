from django.test import TestCase
from rest_framework.test import APIClient


class HealthEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_live_endpoint(self):
        response = self.client.get("/health/live")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["type"], "live")

    def test_ready_endpoint(self):
        response = self.client.get("/health/ready")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["type"], "ready")
