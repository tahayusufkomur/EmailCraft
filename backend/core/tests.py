from io import StringIO

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from core.management.commands.create_demo_org import _highest_plan_key
from core.models import ApiKey, Organization, UserOrganization
from templates_api.models import Template


class CreateDemoOrgCommandTests(TestCase):
    def test_creates_highest_tier_org_with_max_quotas_key_and_template(self):
        out = StringIO()
        call_command('create_demo_org', stdout=out)

        org = Organization.objects.get(email='demo-enterprise@mailcraft.dev')
        highest_plan = _highest_plan_key()
        expected_limits = settings.PLAN_LIMITS[highest_plan]

        self.assertEqual(org.plan, highest_plan)
        self.assertEqual(org.rendered_emails_limit, expected_limits['rendered_emails_limit'])
        self.assertEqual(org.storage_limit_bytes, expected_limits['storage_limit_bytes'])
        self.assertTrue(org.stripe_customer_id.startswith('cus_demo_'))
        self.assertTrue(org.stripe_subscription_id.startswith(f'sub_demo_{highest_plan}_'))

        active_key = ApiKey.objects.get(org=org, environment='test', is_active=True, revoked_at__isnull=True)
        self.assertEqual(active_key.key_prefix, 'mc_test_0000')

        membership = UserOrganization.objects.select_related('user').get(organization=org, role='owner')
        self.assertEqual(membership.user.username, 'demo')
        self.assertEqual(membership.user.email, 'demo-user@mailcraft.dev')
        self.assertTrue(membership.user.check_password('demo12345'))

        template = Template.objects.get(org=org, name='Builder E2E Demo Template')
        body_blocks = template.json_data['body']['blocks']
        self.assertIn('{{user_name}}', body_blocks[0]['data']['html'])
        self.assertIn('{{user_email}}', body_blocks[0]['data']['html'])
        self.assertIn('{{user_name}}', body_blocks[1]['data']['html'])
        self.assertIn('{{user_email}}', body_blocks[1]['data']['html'])

        output = out.getvalue()
        self.assertIn('API_KEY=mc_test_00000000000000000000000000000000', output)
        self.assertIn('DEMO_USERNAME=demo', output)
        self.assertIn('DEMO_PASSWORD=demo12345', output)
        self.assertIn('TEMPLATE_ID=', output)

    def test_re_running_command_reuses_static_api_key(self):
        call_command('create_demo_org')
        call_command('create_demo_org')

        org = Organization.objects.get(email='demo-enterprise@mailcraft.dev')
        self.assertEqual(ApiKey.objects.filter(org=org, environment='test').count(), 1)
        self.assertEqual(
            ApiKey.objects.filter(org=org, environment='test', is_active=True, revoked_at__isnull=True).count(),
            1,
        )


class SiteOrganizationsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='owner',
            email='owner@mailcraft.dev',
            password='owner12345',
        )
        self.billing_org = Organization.objects.create(
            name='Owner Org',
            email='owner-org@mailcraft.dev',
            plan='pro',
        )
        self.billing_org.apply_plan_limits(save=True)
        self.billing_org.rendered_emails_count = 777
        self.billing_org.storage_used_bytes = 123456
        self.billing_org.save(update_fields=['rendered_emails_count', 'storage_used_bytes', 'updated_at'])
        UserOrganization.objects.create(user=self.user, organization=self.billing_org, role='owner')

        token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_can_create_update_org_and_reuse_or_refresh_test_api_key(self):
        create_response = self.client.post(
            '/api/v1/site/organizations/',
            {
                'name': 'Second Org',
                'email': 'second-org@mailcraft.dev',
                'allowed_origins': ['http://localhost:5173'],
            },
            format='json',
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertIn('organization', create_response.data)
        self.assertIn('created_api_key', create_response.data)
        self.assertTrue(create_response.data['created_api_key']['raw'].startswith('mc_test_'))

        org_id = create_response.data['organization']['id']
        self.assertTrue(
            UserOrganization.objects.filter(user=self.user, organization_id=org_id, role='owner').exists()
        )

        update_response = self.client.patch(
            f'/api/v1/site/organizations/{org_id}/',
            {
                'name': 'Second Org Updated',
                'allowed_origins': ['http://localhost:5174'],
            },
            format='json',
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data['name'], 'Second Org Updated')
        self.assertEqual(update_response.data['allowed_origins'], ['http://localhost:5174'])

        key_response = self.client.post(
            f'/api/v1/site/organizations/{org_id}/api-keys',
            {},
            format='json',
        )
        self.assertEqual(key_response.status_code, 201)
        self.assertTrue(key_response.data['raw'].startswith('mc_test_'))
        first_key = key_response.data['raw']

        key_response_repeat = self.client.post(
            f'/api/v1/site/organizations/{org_id}/api-keys',
            {},
            format='json',
        )
        self.assertEqual(key_response_repeat.status_code, 201)
        self.assertEqual(key_response_repeat.data['raw'], first_key)
        self.assertFalse(key_response_repeat.data['refreshed'])

        refresh_response = self.client.post(
            f'/api/v1/site/organizations/{org_id}/api-keys',
            {'refresh': True},
            format='json',
        )
        self.assertEqual(refresh_response.status_code, 201)
        self.assertNotEqual(refresh_response.data['raw'], first_key)
        self.assertTrue(refresh_response.data['refreshed'])
        self.assertEqual(
            ApiKey.objects.filter(
                org_id=org_id,
                environment='test',
                is_active=True,
                revoked_at__isnull=True,
            ).count(),
            1,
        )

        list_response = self.client.get('/api/v1/site/organizations/')
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data['results']), 2)

    def test_dashboard_usage_is_shared_across_user_organizations(self):
        secondary_org = Organization.objects.create(
            name='Secondary Org',
            email='secondary-org@mailcraft.dev',
            plan='free',
        )
        secondary_org.apply_plan_limits(save=True)
        UserOrganization.objects.create(user=self.user, organization=secondary_org, role='owner')

        dashboard_response = self.client.get('/api/v1/site/dashboard')
        self.assertEqual(dashboard_response.status_code, 200)
        self.assertEqual(dashboard_response.data['plan'], self.billing_org.plan)
        self.assertEqual(
            dashboard_response.data['rendered_emails_count'],
            self.billing_org.rendered_emails_count,
        )
        self.assertEqual(
            dashboard_response.data['storage_used_bytes'],
            self.billing_org.storage_used_bytes,
        )
        self.assertEqual(dashboard_response.data['organizations_count'], 2)

    def test_api_key_session_uses_billing_org_limits(self):
        secondary_org = Organization.objects.create(
            name='Secondary Org',
            email='secondary-billing@mailcraft.dev',
            plan='free',
            allowed_origins=['http://localhost:5173'],
        )
        secondary_org.apply_plan_limits(save=True)
        UserOrganization.objects.create(user=self.user, organization=secondary_org, role='owner')

        raw_key = ApiKey.generate_key('test')
        ApiKey.objects.create(
            org=secondary_org,
            key_hash=ApiKey.hash_key(raw_key),
            key_prefix=raw_key[:12],
            environment='test',
            scope='full',
        )

        response = self.client.post(
            '/api/v1/auth/session',
            {'origin': 'http://localhost:5173'},
            format='json',
            HTTP_X_API_KEY=raw_key,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['config']['plan'], self.billing_org.plan)
        self.assertEqual(
            response.data['config']['rendered_emails_limit'],
            self.billing_org.rendered_emails_limit,
        )
