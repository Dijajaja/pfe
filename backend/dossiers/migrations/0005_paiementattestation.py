import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dossiers", "0004_dossierbourse_niveau"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PaiementAttestation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("methode", models.CharField(choices=[("BANKILY", "Bankily"), ("MASRVI", "Masrvi"), ("SEDAD", "Sedad")], max_length=16)),
                ("telephone", models.CharField(max_length=32)),
                ("code_transaction", models.CharField(max_length=4)),
                ("montant", models.DecimalField(decimal_places=2, default=50, max_digits=8)),
                ("reference", models.CharField(max_length=32, unique=True)),
                ("paye_le", models.DateTimeField(auto_now_add=True)),
                (
                    "dossier",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="paiements_attestation",
                        to="dossiers.dossierbourse",
                    ),
                ),
                (
                    "etudiant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="paiements_attestation",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "paiement attestation",
                "verbose_name_plural": "paiements attestation",
                "ordering": ("-paye_le",),
            },
        ),
    ]
