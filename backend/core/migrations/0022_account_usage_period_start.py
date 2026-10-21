from django.db import migrations, models

import core.models


class Migration(migrations.Migration):
    """Accounts that exist get no month: their counters (lifetime totals until now) start over on their
    next visit. New accounts count from the month they are created in."""

    dependencies = [
        ('core', '0021_account_ai_generations_unlimited'),
    ]

    operations = [
        migrations.AddField(
            model_name='account',
            name='usage_period_start',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='account',
            name='usage_period_start',
            field=models.DateField(blank=True, default=core.models.month_start, null=True),
        ),
    ]
