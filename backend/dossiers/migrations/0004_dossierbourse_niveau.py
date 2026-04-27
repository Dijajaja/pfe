from decimal import Decimal

from django.db import migrations, models


def backfill_montant_by_niveau(apps, schema_editor):
    DossierBourse = apps.get_model("dossiers", "DossierBourse")
    for dossier in DossierBourse.objects.all().only("id", "niveau"):
        montant = Decimal("1650.00") if dossier.niveau == "L3" else Decimal("1350.00")
        DossierBourse.objects.filter(pk=dossier.pk).update(montant_bourse=montant)


class Migration(migrations.Migration):
    dependencies = [
        ("dossiers", "0003_dossierbourse_cni_telephone"),
    ]

    operations = [
        migrations.AddField(
            model_name="dossierbourse",
            name="niveau",
            field=models.CharField(
                choices=[("L1", "L1"), ("L2", "L2"), ("L3", "L3")],
                default="L1",
                help_text="Niveau d'étude servant au calcul automatique du montant de bourse.",
                max_length=2,
            ),
        ),
        migrations.RunPython(backfill_montant_by_niveau, migrations.RunPython.noop),
    ]
