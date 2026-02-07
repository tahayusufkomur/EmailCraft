from io import StringIO

from django.conf import settings
from django.core.management import call_command
from django.test import TestCase

from core.management.commands.create_demo_org import _highest_plan_key
from core.models import ApiKey, Organization
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
        self.assertTrue(active_key.key_prefix.startswith('mc_test_'))

        template = Template.objects.get(org=org, name='Builder E2E Demo Template')
        body_blocks = template.json_data['body']['blocks']
        self.assertIn('{{user_name}}', body_blocks[0]['data']['html'])
        self.assertIn('{{user_email}}', body_blocks[0]['data']['html'])
        self.assertIn('{{user_name}}', body_blocks[1]['data']['html'])
        self.assertIn('{{user_email}}', body_blocks[1]['data']['html'])

        output = out.getvalue()
        self.assertIn('API_KEY=mc_test_', output)
        self.assertIn('TEMPLATE_ID=', output)

    def test_re_running_command_rotates_previous_key_for_same_environment(self):
        call_command('create_demo_org')
        call_command('create_demo_org')

        org = Organization.objects.get(email='demo-enterprise@mailcraft.dev')
        self.assertEqual(ApiKey.objects.filter(org=org, environment='test').count(), 2)
        self.assertEqual(
            ApiKey.objects.filter(org=org, environment='test', is_active=True, revoked_at__isnull=True).count(),
            1,
        )
