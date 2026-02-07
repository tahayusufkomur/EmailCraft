from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_userorganization'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='userorganization',
            name='user',
            field=models.ForeignKey(
                on_delete=models.CASCADE,
                related_name='organization_memberships',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddConstraint(
            model_name='userorganization',
            constraint=models.UniqueConstraint(
                fields=('user', 'organization'),
                name='unique_user_organization_membership',
            ),
        ),
    ]
