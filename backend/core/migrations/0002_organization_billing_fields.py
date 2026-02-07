from django.db import migrations, models


def set_existing_plan_limits(apps, schema_editor):
    Organization = apps.get_model('core', 'Organization')
    limits = {
        'free': {'rendered_emails_limit': 1000, 'storage_limit_bytes': 1 * 1024 * 1024 * 1024},
        'starter': {'rendered_emails_limit': 10000, 'storage_limit_bytes': 5 * 1024 * 1024 * 1024},
        'pro': {'rendered_emails_limit': 50000, 'storage_limit_bytes': 20 * 1024 * 1024 * 1024},
        'enterprise': {'rendered_emails_limit': 1000000, 'storage_limit_bytes': 100 * 1024 * 1024 * 1024},
    }

    for org in Organization.objects.all():
        plan_limits = limits.get(org.plan, limits['free'])
        org.rendered_emails_limit = plan_limits['rendered_emails_limit']
        org.storage_limit_bytes = plan_limits['storage_limit_bytes']
        org.save(update_fields=['rendered_emails_limit', 'storage_limit_bytes'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='rendered_emails_count',
            field=models.BigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='organization',
            name='rendered_emails_limit',
            field=models.BigIntegerField(default=1000),
        ),
        migrations.AddField(
            model_name='organization',
            name='stripe_customer_id',
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        migrations.AddField(
            model_name='organization',
            name='stripe_subscription_id',
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        migrations.AlterField(
            model_name='organization',
            name='storage_limit_bytes',
            field=models.BigIntegerField(default=1073741824),
        ),
        migrations.RunPython(set_existing_plan_limits, migrations.RunPython.noop),
    ]
