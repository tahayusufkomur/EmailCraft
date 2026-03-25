from django.core.management.base import BaseCommand

from core.models import ApiKey, Organization, Plan


class Command(BaseCommand):
    help = 'Create an API key for an organization'

    def add_arguments(self, parser):
        parser.add_argument('--org-name', type=str, required=True)
        parser.add_argument('--org-email', type=str, required=True)
        parser.add_argument('--env', type=str, default='test', choices=['live', 'test'])
        parser.add_argument('--plan', type=str, default='free')

    def handle(self, *args, **options):
        plan_obj = Plan.objects.filter(slug=options['plan']).first() or Plan.get_default()
        org, created = Organization.objects.get_or_create(
            email=options['org_email'],
            defaults={'name': options['org_name'], 'plan': plan_obj},
        )
        if created:
            org.apply_plan_limits()
            self.stdout.write(self.style.SUCCESS(f'Created organization: {org.name}'))
        else:
            if org.plan != plan_obj:
                org.plan = plan_obj
                org.apply_plan_limits()
            self.stdout.write(f'Using existing organization: {org.name}')

        raw_key = ApiKey.generate_key(options['env'])
        ApiKey.objects.create(
            org=org,
            key_hash=ApiKey.hash_key(raw_key),
            key_prefix=raw_key[:12],
            environment=options['env'],
        )

        self.stdout.write(self.style.SUCCESS(f'\nAPI Key: {raw_key}'))
        self.stdout.write(self.style.WARNING('Save this key — it cannot be retrieved later.'))
