from django.db import migrations


PLANS = [
    {
        'name': 'Free',
        'slug': 'free',
        'monthly_price_usd': 0,
        'rendered_emails_limit': 1000,
        'storage_limit_bytes': 1 * 1024 * 1024 * 1024,
        'max_upload_size_bytes': 5 * 1024 * 1024,
        'max_media_files_per_upload': 5,
        'is_default': True,
        'sort_order': 0,
    },
    {
        'name': 'Starter',
        'slug': 'starter',
        'monthly_price_usd': 5,
        'rendered_emails_limit': 10000,
        'storage_limit_bytes': 5 * 1024 * 1024 * 1024,
        'max_upload_size_bytes': 25 * 1024 * 1024,
        'max_media_files_per_upload': 15,
        'is_default': False,
        'sort_order': 1,
    },
    {
        'name': 'Pro',
        'slug': 'pro',
        'monthly_price_usd': 20,
        'rendered_emails_limit': 50000,
        'storage_limit_bytes': 20 * 1024 * 1024 * 1024,
        'max_upload_size_bytes': 50 * 1024 * 1024,
        'max_media_files_per_upload': 40,
        'is_default': False,
        'sort_order': 2,
    },
    {
        'name': 'Enterprise',
        'slug': 'enterprise',
        'monthly_price_usd': 100,
        'rendered_emails_limit': 1000000,
        'storage_limit_bytes': 100 * 1024 * 1024 * 1024,
        'max_upload_size_bytes': 100 * 1024 * 1024,
        'max_media_files_per_upload': 120,
        'is_default': False,
        'sort_order': 3,
    },
]

# Map old CharField plan values to plan slugs
PLAN_SLUG_MAP = {
    'free': 'free',
    'starter': 'starter',
    'pro': 'pro',
    'enterprise': 'enterprise',
}


def seed_plans(apps, schema_editor):
    Plan = apps.get_model('core', 'Plan')
    for plan_data in PLANS:
        Plan.objects.get_or_create(slug=plan_data['slug'], defaults=plan_data)


def link_orgs_to_plans(apps, schema_editor):
    """Link existing orgs that still have the old CharField value to the new Plan FK."""
    Organization = apps.get_model('core', 'Organization')
    Plan = apps.get_model('core', 'Plan')
    plan_cache = {p.slug: p for p in Plan.objects.all()}
    default_plan = plan_cache.get('free')

    for org in Organization.objects.filter(plan__isnull=True):
        org.plan = default_plan
        org.save(update_fields=['plan'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_plan_model'),
    ]

    operations = [
        migrations.RunPython(seed_plans, migrations.RunPython.noop),
        migrations.RunPython(link_orgs_to_plans, migrations.RunPython.noop),
    ]
