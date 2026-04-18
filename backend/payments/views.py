from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin, IsEtudiant, IsPartenaire

from .models import ListeBeneficiaires, Paiement
from .serializers import (
    GenererListeSerializer,
    ListeBeneficiairesSerializer,
    PartenaireConfirmationSerializer,
    PaiementSerializer,
)
from .services import confirmer_paiements, generer_liste_beneficiaires


class AdminListeBeneficiairesViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdmin]
    serializer_class = ListeBeneficiairesSerializer
    queryset = ListeBeneficiaires.objects.select_related(
        "annee_universitaire", "partenaire"
    ).annotate(nombre_paiements=Count("paiements", distinct=True))

    def get_queryset(self):
        qs = super().get_queryset()
        annee = self.request.query_params.get("annee_universitaire")
        if annee:
            qs = qs.filter(annee_universitaire_id=annee)
        return qs

    def get_serializer_class(self):
        if self.action == "generer":
            return GenererListeSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=["post"], url_path="generer")
    def generer(self, request):
        ser = GenererListeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        annee = ser.validated_data["annee_universitaire_id"]
        periode = ser.validated_data.get("periode") or ""
        montant_defaut = ser.validated_data.get("montant_defaut")
        liste = generer_liste_beneficiaires(
            annee=annee,
            periode=periode,
            montant_defaut=montant_defaut,
        )
        liste = ListeBeneficiaires.objects.annotate(
            nombre_paiements=Count("paiements", distinct=True)
        ).get(pk=liste.pk)
        out = ListeBeneficiairesSerializer(
            liste, context={"request": request}
        ).data
        return Response(out, status=status.HTTP_201_CREATED)


class AdminPaiementViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdmin]
    serializer_class = PaiementSerializer
    queryset = Paiement.objects.select_related(
        "liste", "dossier", "annee_universitaire"
    )

    def get_queryset(self):
        qs = super().get_queryset()
        annee = self.request.query_params.get("annee_universitaire")
        liste = self.request.query_params.get("liste")
        statut = self.request.query_params.get("statut")
        if annee:
            qs = qs.filter(annee_universitaire_id=annee)
        if liste:
            qs = qs.filter(liste_id=liste)
        if statut:
            qs = qs.filter(statut=statut)
        return qs


class PartnerListeView(APIView):
    permission_classes = [IsPartenaire]

    def get(self, request, reference):
        liste = get_object_or_404(
            ListeBeneficiaires.objects.select_related("annee_universitaire"),
            reference=reference,
        )
        assignee = liste.partenaire_id
        if assignee and assignee != request.user.id:
            return Response(
                {"detail": "Liste non assignée à votre compte."},
                status=status.HTTP_403_FORBIDDEN,
            )
        paiements = Paiement.objects.filter(liste=liste).select_related("dossier")
        data = ListeBeneficiairesSerializer(liste).data
        data["paiements"] = PaiementSerializer(paiements, many=True).data
        return Response(data)


class PartnerConfirmationView(APIView):
    permission_classes = [IsPartenaire]

    def post(self, request):
        ser = PartenaireConfirmationSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        count, errors = confirmer_paiements(
            updates=ser.validated_data["operations"],
            utilisateur_partenaire_id=request.user.id,
        )
        return Response({"mis_a_jour": count, "erreurs": errors})


class StudentPaiementViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsEtudiant]
    serializer_class = PaiementSerializer

    def get_queryset(self):
        return Paiement.objects.filter(
            dossier__etudiant=self.request.user
        ).select_related("liste", "dossier", "annee_universitaire")
