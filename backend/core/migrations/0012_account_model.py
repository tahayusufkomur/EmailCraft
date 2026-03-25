import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def migrate_billing_to_accounts(apps, schema_editor):
    """Create Account for each user who owns an org, copying billing data from their primary org."""
    Account = apps.get_model('core', 'Account')
    UserOrganization = apps.get_model('core', 'UserOrganization')
    Plan = apps.get_model('core', 'Plan')

    default_plan = Plan.objects.filter(is_default=True).first() or Plan.objects.order_by('sort_order').first()

    # Get all unique users who own orgs
    seen_users = set()
    for membership in UserOrganization.objects.select_related('organization').filter(role='owner').order_by('created_at'):
        user_id = membership.user_id
        if user_id in seen_users:
            continue
        seen_users.add(user_id)

        org = membership.organization
        Account.objects.get_or_create(
            user_id=user_id,
            defaults={
                'plan': org.plan or default_plan,
                'rendered_emails_count': org.rendered_emails_count,
                'rendered_emails_limit': org.rendered_emails_limit,
                'storage_used_bytes': org.storage_used_bytes,
                'storage_limit_bytes': org.storage_limit_bytes,
                'stripe_customer_id': org.stripe_customer_id or '',
                'stripe_subscription_id': org.stripe_subscription_id or '',
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_plan_model'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Create Account table
        migrations.CreateModel(
            name='Account',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rendered_emails_count', models.BigIntegerField(default=0)),
                ('rendered_emails_limit', models.BigIntegerField(default=1000)),
                ('storage_used_bytes', models.BigIntegerField(default=0)),
                ('storage_limit_bytes', models.BigIntegerField(default=1073741824)),
                ('stripe_customer_id', models.CharField(blank=True, max_length=120, null=True)),
                ('stripe_subscription_id', models.CharField(blank=True, max_length=120, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('plan', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='accounts', to='core.plan')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='account', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'accounts',
            },
        ),
        # 2. Migrate billing data from orgs to accounts
        migrations.RunPython(migrate_billing_to_accounts, migrations.RunPython.noop),
        # 3. Remove billing fields from Organization
        migrations.RemoveField(model_name='organization', name='plan'),
        migrations.RemoveField(model_name='organization', name='rendered_emails_count'),
        migrations.RemoveField(model_name='organization', name='rendered_emails_limit'),
        migrations.RemoveField(model_name='organization', name='storage_limit_bytes'),
        migrations.RemoveField(model_name='organization', name='storage_used_bytes'),
        migrations.RemoveField(model_name='organization', name='stripe_customer_id'),
        migrations.RemoveField(model_name='organization', name='stripe_subscription_id'),
    ]
