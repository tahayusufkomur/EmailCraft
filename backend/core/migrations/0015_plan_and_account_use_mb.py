from django.db import migrations, models

MB = 1024 * 1024


def bytes_to_mb(apps, schema_editor):
    Plan = apps.get_model('core', 'Plan')
    for plan in Plan.objects.all():
        plan.storage_limit_mb = max(1, plan.storage_limit_bytes // MB)
        plan.max_upload_size_mb = max(1, plan.max_upload_size_bytes // MB)
        plan.save(update_fields=['storage_limit_mb', 'max_upload_size_mb'])

    Account = apps.get_model('core', 'Account')
    for account in Account.objects.all():
        account.storage_limit_mb = max(1, account.storage_limit_bytes // MB)
        account.save(update_fields=['storage_limit_mb'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_organization_custom_palette_and_more'),
    ]

    operations = [
        # 1. Add new MB columns with defaults
        migrations.AddField(
            model_name='plan',
            name='storage_limit_mb',
            field=models.PositiveIntegerField(default=1024),
        ),
        migrations.AddField(
            model_name='plan',
            name='max_upload_size_mb',
            field=models.PositiveIntegerField(default=5),
        ),
        migrations.AddField(
            model_name='account',
            name='storage_limit_mb',
            field=models.PositiveIntegerField(default=1024),
        ),
        # 2. Convert existing byte values to MB
        migrations.RunPython(bytes_to_mb, migrations.RunPython.noop),
        # 3. Remove old byte columns
        migrations.RemoveField(model_name='plan', name='storage_limit_bytes'),
        migrations.RemoveField(model_name='plan', name='max_upload_size_bytes'),
        migrations.RemoveField(model_name='account', name='storage_limit_bytes'),
    ]
