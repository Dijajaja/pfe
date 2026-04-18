from io import BytesIO

from django.http import HttpResponse
from openpyxl import Workbook
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin
from dossiers.models import DossierBourse, StatutDossier
from payments.models import Paiement, StatutPaiement


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        annee = request.query_params.get("annee_universitaire")
        dossiers = DossierBourse.objects.all()
        paiements = Paiement.objects.all()
        if annee:
            dossiers = dossiers.filter(annee_universitaire_id=annee)
            paiements = paiements.filter(annee_universitaire_id=annee)

        return Response(
            {
                "filtre_annee_universitaire_id": annee,
                "dossiers": {
                    "total": dossiers.count(),
                    **{
                        s.value: dossiers.filter(statut=s.value).count()
                        for s in StatutDossier
                    },
                },
                "paiements": {
                    "total": paiements.count(),
                    **{
                        s.value: paiements.filter(statut=s.value).count()
                        for s in StatutPaiement
                    },
                },
            }
        )


class AdminExportPaiementsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        annee = request.query_params.get("annee_universitaire")
        liste = request.query_params.get("liste")
        qs = Paiement.objects.select_related(
            "liste", "dossier", "dossier__etudiant"
        ).order_by("liste_id", "id")
        if annee:
            qs = qs.filter(annee_universitaire_id=annee)
        if liste:
            qs = qs.filter(liste_id=liste)

        wb = Workbook()
        ws = wb.active
        ws.title = "Paiements"
        ws.append(
            [
                "paiement_id",
                "liste_reference",
                "dossier_id",
                "etudiant_email",
                "montant",
                "statut",
                "reference_externe",
                "date_operation",
            ]
        )
        for pay in qs:
            ws.append(
                [
                    pay.id,
                    str(pay.liste.reference),
                    pay.dossier_id,
                    pay.dossier.etudiant.email,
                    float(pay.montant),
                    pay.statut,
                    pay.reference_externe,
                    pay.date_operation.isoformat() if pay.date_operation else "",
                ]
            )

        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)
        response = HttpResponse(
            buf.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="export_paiements.xlsx"'
        return response
