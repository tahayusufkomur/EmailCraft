from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_userorganization_multi_org'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='test_key_version',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
