from io import StringIO

from django.conf import settings
from django.core.management import call_command
from django.test import TestCase

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
