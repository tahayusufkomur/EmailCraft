from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_organization_email_background_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='builder_theme',
            field=models.CharField(
                choices=[
                    ('light-breeze', 'Light Breeze'),
                    ('light-paper', 'Light Paper'),
                    ('dark-slate', 'Dark Slate'),
                    ('dark-cosmos', 'Dark Cosmos'),
                ],
                default='light-breeze',
                max_length=30,
            ),
        ),
    ]
