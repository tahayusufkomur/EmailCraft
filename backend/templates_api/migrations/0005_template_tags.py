from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('templates_api', '0004_template_is_premium'),
    ]

    operations = [
        migrations.AddField(
            model_name='template',
            name='tags',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
