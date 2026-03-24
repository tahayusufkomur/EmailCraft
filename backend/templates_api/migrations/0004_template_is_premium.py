from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('templates_api', '0003_uploadedimage_thumbnail_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='template',
            name='is_premium',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddIndex(
            model_name='template',
            index=models.Index(fields=['is_gallery', 'is_premium'], name='tmpl_gallery_prem_idx'),
        ),
    ]
