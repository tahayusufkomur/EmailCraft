from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_organization_available_variables'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='email_background_color',
            field=models.CharField(default='#f4f4f4', max_length=20),
        ),
        migrations.AddField(
            model_name='organization',
            name='email_background_style',
            field=models.CharField(
                choices=[
                    ('none', 'Solid'),
                    ('aurora', 'Aurora'),
                    ('sunset-glow', 'Sunset Glow'),
                    ('mint-weave', 'Mint Weave'),
                    ('midnight-grid', 'Midnight Grid'),
                    ('paper-rings', 'Paper Rings'),
                ],
                default='none',
                max_length=30,
            ),
        ),
    ]
