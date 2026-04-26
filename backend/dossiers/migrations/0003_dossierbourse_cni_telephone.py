from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dossiers", "0002_dossierbourse_montant_bourse"),
    ]

    operations = [
        migrations.AddField(
            model_name="dossierbourse",
            name="numero_cni",
            field=models.CharField(blank=True, max_length=64, verbose_name="numéro CNI"),
        ),
        migrations.AddField(
            model_name="dossierbourse",
            name="telephone",
            field=models.CharField(blank=True, max_length=32, verbose_name="téléphone"),
        ),
    ]
