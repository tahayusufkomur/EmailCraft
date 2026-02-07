import re

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from core.models import ApiKey, Organization, UserOrganization
from templates_api.models import Template


def _highest_plan_key():
    return max(
        settings.PLAN_LIMITS.items(),
        key=lambda item: (
            item[1].get('monthly_price_usd', 0),
            item[1].get('rendered_emails_limit', 0),
            item[1].get('storage_limit_bytes', 0),
            item[1].get('max_upload_size_bytes', 0),
        ),
    )[0]


def _demo_template_json(iframe_src):
    return {
        'version': 1,
        'settings': {
            'backgroundColor': '#f4f7fb',
            'contentWidth': 600,
            'defaultFont': 'Arial, Helvetica, sans-serif',
            'defaultFontSize': 14,
            'defaultColor': '#0f172a',
        },
        'header': {
            'blocks': [
                {
                    'id': 'demo-header-1',
                    'type': 'text',
                    'data': {
                        'html': '<p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">MailCraft Builder Demo</p>',
                        'variables': [],
                    },
                    'style': {
                        'padding': {'top': 24, 'right': 24, 'bottom': 8, 'left': 24},
                        'alignment': 'center',
                    },
                },
            ],
        },
        'body': {
            'blocks': [
                {
                    'id': 'demo-body-1',
                    'type': 'text',
                    'data': {
                        'html': (
                            '<h2 style="margin:0 0 12px 0;font-size:24px;">Hello {{user_name}},</h2>'
                            '<p style="margin:0 0 8px 0;">This template uses dynamic variables and a custom HTML block.</p>'
                            '<p style="margin:0;">Email on file: <strong>{{user_email}}</strong></p>'
                        ),
                        'variables': ['user_name', 'user_email'],
                    },
                    'style': {
                        'padding': {'top': 12, 'right': 24, 'bottom': 16, 'left': 24},
                        'alignment': 'left',
                    },
                },
                {
                    'id': 'demo-body-2',
                    'type': 'html',
                    'data': {
                        'html': (
                            '<div style="border:1px solid #cbd5e1;border-radius:10px;overflow:hidden;">'
                            f'<iframe src="{iframe_src}?user_name={{{{user_name}}}}&user_email={{{{user_email}}}}" '
                            'title="Demo Embedded Iframe" width="100%" height="180" '
                            'style="border:0;display:block;"></iframe>'
                            '</div>'
                        ),
                    },
                    'style': {
                        'padding': {'top': 0, 'right': 24, 'bottom': 16, 'left': 24},
                        'alignment': 'left',
                    },
                },
                {
                    'id': 'demo-body-3',
                    'type': 'button',
                    'data': {
                        'text': 'View Account for {{user_email}}',
                        'url': 'https://example.com/account/{{user_email}}',
                    },
                    'style': {
                        'padding': {'top': 8, 'right': 24, 'bottom': 20, 'left': 24},
                        'alignment': 'left',
                        'backgroundColor': '#2563eb',
                        'color': '#ffffff',
                        'borderRadius': 6,
                        'fullWidth': False,
                        'fontSize': 14,
                        'fontFamily': 'Arial, Helvetica, sans-serif',
                    },
                },
            ],
        },
        'footer': {'blocks': []},
    }


class Command(BaseCommand):
    help = (
        'Create or update a demo organization on the highest plan tier, '
        'create a fresh API key, and seed a simple end-to-end test template.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--org-name', type=str, default='MailCraft Demo Enterprise')
        parser.add_argument('--org-email', type=str, default='demo-enterprise@mailcraft.dev')
        parser.add_argument('--env', type=str, default='test', choices=['live', 'test'])
        parser.add_argument('--api-key', type=str, default='')
        parser.add_argument('--demo-username', type=str, default='demo')
        parser.add_argument('--demo-user-email', type=str, default='demo-user@mailcraft.dev')
        parser.add_argument('--demo-password', type=str, default='demo12345')
        parser.add_argument('--template-name', type=str, default='Builder E2E Demo Template')
        parser.add_argument('--skip-template', action='store_true')
        parser.add_argument('--iframe-src', type=str, default='https://example.com/embed')

    def handle(self, *args, **options):
        plan_key = _highest_plan_key()
        default_allowed_origins = [
            'http://localhost',
            'http://127.0.0.1',
            'http://localhost:80',
            'http://localhost:5173',
            'http://localhost:5174',
        ]

        org, created = Organization.objects.get_or_create(
            email=options['org_email'],
            defaults={
                'name': options['org_name'],
                'plan': plan_key,
                'allowed_origins': default_allowed_origins,
            },
        )

        merged_origins = list(dict.fromkeys([*(org.allowed_origins or []), *default_allowed_origins]))
        org.name = options['org_name']
        org.plan = plan_key
        org.allowed_origins = merged_origins
        org.apply_plan_limits(save=False)
        org.stripe_customer_id = org.stripe_customer_id or f'cus_demo_{org.id.hex[:14]}'
        org.stripe_subscription_id = f'sub_demo_{plan_key}_{org.id.hex[:10]}'
        org.save(
            update_fields=[
                'name',
                'plan',
                'allowed_origins',
                'rendered_emails_limit',
                'storage_limit_bytes',
                'stripe_customer_id',
                'stripe_subscription_id',
                'updated_at',
            ]
        )

        requested_api_key = (options.get('api_key') or '').strip() or f"mc_{options['env']}_{'0' * 32}"
        if not re.fullmatch(rf'^mc_{options["env"]}_[a-f0-9]{{32}}$', requested_api_key):
            raise CommandError(
                f'--api-key must match mc_{options["env"]}_<32 lowercase hex chars>. '
                f'Received: {requested_api_key}'
            )

        now = timezone.now()
        requested_hash = ApiKey.hash_key(requested_api_key)
        existing_for_hash = ApiKey.objects.filter(key_hash=requested_hash).select_related('org').first()
        if existing_for_hash and existing_for_hash.org_id != org.id:
            raise CommandError(
                f'The requested API key is already used by another organization: {existing_for_hash.org.email}'
            )

        ApiKey.objects.filter(
            org=org,
            environment=options['env'],
            is_active=True,
            revoked_at__isnull=True,
        ).exclude(key_hash=requested_hash).update(is_active=False, revoked_at=now)

        if existing_for_hash:
            existing_for_hash.environment = options['env']
            existing_for_hash.key_prefix = requested_api_key[:12]
            existing_for_hash.is_active = True
            existing_for_hash.revoked_at = None
            existing_for_hash.save(update_fields=['environment', 'key_prefix', 'is_active', 'revoked_at'])
            raw_key = requested_api_key
        else:
            raw_key = requested_api_key
            ApiKey.objects.create(
                org=org,
                key_hash=requested_hash,
                key_prefix=raw_key[:12],
                environment=options['env'],
            )

        demo_user, _ = User.objects.get_or_create(
            username=options['demo_username'],
            defaults={'email': options['demo_user_email']},
        )
        demo_user.email = options['demo_user_email']
        demo_user.is_active = True
        demo_user.set_password(options['demo_password'])
        demo_user.save(update_fields=['email', 'is_active', 'password'])

        UserOrganization.objects.update_or_create(
            user=demo_user,
            defaults={'organization': org, 'role': 'owner'},
        )

        template = None
        if not options['skip_template']:
            template, _ = Template.objects.update_or_create(
                org=org,
                name=options['template_name'],
                defaults={
                    'json_data': _demo_template_json(options['iframe_src']),
                    'category': 'transactional',
                    'is_draft': False,
                    'is_gallery': False,
                },
            )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created organization: {org.name}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Updated organization: {org.name}'))

        self.stdout.write(f'ORG_ID={org.id}')
        self.stdout.write(f'ORG_EMAIL={org.email}')
        self.stdout.write(f'PLAN={org.plan}')
        self.stdout.write(f'RENDERED_EMAILS_LIMIT={org.rendered_emails_limit}')
        self.stdout.write(f'STORAGE_LIMIT_BYTES={org.storage_limit_bytes}')
        self.stdout.write(f'DEMO_USERNAME={demo_user.username}')
        self.stdout.write(f'DEMO_USER_EMAIL={demo_user.email}')
        self.stdout.write(f'DEMO_PASSWORD={options["demo_password"]}')
        self.stdout.write(f'API_KEY={raw_key}')
        if template:
            self.stdout.write(f'TEMPLATE_ID={template.id}')
            self.stdout.write(f'TEMPLATE_NAME={template.name}')
        self.stdout.write('IFRAME_DEMO_PAGE=http://localhost/builder-demo.html?apiKey=<API_KEY>')
