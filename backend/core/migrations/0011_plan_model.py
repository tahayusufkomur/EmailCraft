import django.db.models.deletion
from django.db import migrations, models


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


def seed_plans_and_link_orgs(apps, schema_editor):
    Plan = apps.get_model('core', 'Plan')
    Organization = apps.get_model('core', 'Organization')

    # Seed plans
    plan_cache = {}
    for plan_data in PLANS:
        obj, _ = Plan.objects.get_or_create(slug=plan_data['slug'], defaults=plan_data)
        plan_cache[plan_data['slug']] = obj

    default_plan = plan_cache.get('free')

    # Link existing orgs: old plan CharField value is still in plan_old
    for org in Organization.objects.all():
        slug = org.plan_old or 'free'
        org.plan = plan_cache.get(slug, default_plan)
        org.save(update_fields=['plan'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_session'),
    ]

    operations = [
        # 1. Create the Plan table
        migrations.CreateModel(
            name='Plan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('slug', models.SlugField(unique=True)),
                ('monthly_price_usd', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('rendered_emails_limit', models.BigIntegerField(default=1000)),
                ('storage_limit_bytes', models.BigIntegerField(default=1073741824)),
                ('max_upload_size_bytes', models.BigIntegerField(default=5242880)),
                ('max_media_files_per_upload', models.PositiveIntegerField(default=5)),
                ('is_default', models.BooleanField(default=False, help_text='New orgs get this plan when no plan is specified.')),
                ('sort_order', models.PositiveIntegerField(default=0)),
            ],
            options={
                'db_table': 'plans',
                'ordering': ['sort_order', 'monthly_price_usd'],
            },
        ),
        # 2. Rename the old plan CharField to plan_old
        migrations.RenameField(
            model_name='organization',
            old_name='plan',
            new_name='plan_old',
        ),
        # 3. Add new plan FK column (nullable)
        migrations.AddField(
            model_name='organization',
            name='plan',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='organizations',
                to='core.plan',
            ),
        ),
        # 4. Seed plans and link existing orgs
        migrations.RunPython(seed_plans_and_link_orgs, migrations.RunPython.noop),
        # 5. Remove the old plan_old column
        migrations.RemoveField(
            model_name='organization',
            name='plan_old',
        ),
    ]
