from django.db import connection
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthLiveView(APIView):
    """
    Liveness probe: le process Django répond.
    """

    permission_classes = (AllowAny,)
    authentication_classes = ()

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "cnou-bourses-api",
                "type": "live",
                "time": timezone.now().isoformat(),
            }
        )


class HealthReadyView(APIView):
    """
    Readiness probe: vérifie les dépendances minimales (DB).
    """

    permission_classes = (AllowAny,)
    authentication_classes = ()

    def get(self, request):
        db_ok = True
        db_error = ""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception as exc:  # pragma: no cover - sécurité prod
            db_ok = False
            db_error = str(exc)

        status = "ok" if db_ok else "degraded"
        payload = {
            "status": status,
            "service": "cnou-bourses-api",
            "type": "ready",
            "dependencies": {"database": "ok" if db_ok else "error"},
            "time": timezone.now().isoformat(),
        }
        if db_error:
            payload["error"] = db_error
        code = 200 if db_ok else 503
        return Response(payload, status=code)
