from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_organization_widget_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='available_variables',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
