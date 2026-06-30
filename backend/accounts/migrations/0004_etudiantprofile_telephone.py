from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_etudiantprofile_nom_prenom"),
    ]

    operations = [
        migrations.AddField(
            model_name="etudiantprofile",
            name="telephone",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
    ]
