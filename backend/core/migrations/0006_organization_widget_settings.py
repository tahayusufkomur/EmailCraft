from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_organization_test_key_version'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='show_export_html_button',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='organization',
            name='show_logo',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='organization',
            name='theme_mode',
            field=models.CharField(
                choices=[('light', 'Light'), ('dark', 'Dark'), ('system', 'System')],
                default='system',
                max_length=10,
            ),
        ),
    ]
