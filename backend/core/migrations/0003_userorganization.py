from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_organization_billing_fields'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserOrganization',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('owner', 'Owner'), ('member', 'Member')], default='owner', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('organization', models.ForeignKey(on_delete=models.CASCADE, related_name='memberships', to='core.organization')),
                ('user', models.OneToOneField(on_delete=models.CASCADE, related_name='organization_membership', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'user_organizations',
            },
        ),
        migrations.AddIndex(
            model_name='userorganization',
            index=models.Index(fields=['organization', 'role'], name='user_org_role_idx'),
        ),
    ]
