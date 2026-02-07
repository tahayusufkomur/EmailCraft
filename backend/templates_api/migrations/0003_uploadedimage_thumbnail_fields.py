from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('templates_api', '0002_uploadedimage_filename'),
    ]

    operations = [
        migrations.AddField(
            model_name='uploadedimage',
            name='thumbnail_s3_key',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.AddField(
            model_name='uploadedimage',
            name='thumbnail_url',
            field=models.URLField(blank=True, null=True),
        ),
    ]
