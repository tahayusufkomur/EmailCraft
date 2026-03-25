from io import StringIO

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from core.management.commands.create_demo_org import _highest_plan
from core.models import ApiKey, Organization, Plan, UserOrganization
from templates_api.models import Template, UploadedImage


def _plan(slug='free'):
    """Get or create a Plan for use in tests."""
    defaults = {
        'free': {'name': 'Free', 'monthly_price_usd': 0, 'rendered_emails_limit': 1000, 'storage_limit_bytes': 1073741824, 'max_upload_size_bytes': 5242880, 'max_media_files_per_upload': 5, 'is_default': True, 'sort_order': 0},
        'starter': {'name': 'Starter', 'monthly_price_usd': 5, 'rendered_emails_limit': 10000, 'storage_limit_bytes': 5368709120, 'max_upload_size_bytes': 26214400, 'max_media_files_per_upload': 15, 'sort_order': 1},
        'pro': {'name': 'Pro', 'monthly_price_usd': 20, 'rendered_emails_limit': 50000, 'storage_limit_bytes': 21474836480, 'max_upload_size_bytes': 52428800, 'max_media_files_per_upload': 40, 'sort_order': 2},
        'enterprise': {'name': 'Enterprise', 'monthly_price_usd': 100, 'rendered_emails_limit': 1000000, 'storage_limit_bytes': 107374182400, 'max_upload_size_bytes': 104857600, 'max_media_files_per_upload': 120, 'sort_order': 3},
    }
    obj, _ = Plan.objects.get_or_create(slug=slug, defaults=defaults.get(slug, defaults['free']))
    return obj


class CreateDemoOrgCommandTests(TestCase):
    def setUp(self):
        for slug in ('free', 'starter', 'pro', 'enterprise'):
            _plan(slug)

    def test_creates_highest_tier_org_with_max_quotas_key_and_template(self):
        out = StringIO()
        call_command('create_demo_org', stdout=out)

        org = Organization.objects.get(email='demo-enterprise@mailcraft.dev')
        membership = UserOrganization.objects.select_related('user').get(organization=org, role='owner')
        from core.models import Account
        account = Account.objects.get(user=membership.user)
        highest_plan = _highest_plan()
        self.assertEqual(account.plan, highest_plan)
        self.assertEqual(account.rendered_emails_limit, highest_plan.rendered_emails_limit)
        self.assertEqual(account.storage_limit_bytes, highest_plan.storage_limit_bytes)
        self.assertTrue(account.stripe_customer_id.startswith('cus_demo_'))
        self.assertTrue(account.stripe_subscription_id.startswith(f'sub_demo_{highest_plan.slug}_'))

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

        demo_starter = User.objects.get(username='demo_starter')
        demo_pro = User.objects.get(username='demo_pro')
        demo_enterprise = User.objects.get(username='demo_enterprise')
        self.assertEqual(demo_starter.email, 'demo_starter@example.com')
        self.assertEqual(demo_pro.email, 'demo_pro@example.com')
        self.assertEqual(demo_enterprise.email, 'demo_enterprise@example.com')
        self.assertTrue(demo_starter.check_password('demo'))
        self.assertTrue(demo_pro.check_password('demo'))
        self.assertTrue(demo_enterprise.check_password('demo'))

        from core.models import Account
        self.assertEqual(Account.objects.get(user=demo_starter).plan_slug, 'starter')
        self.assertEqual(Account.objects.get(user=demo_pro).plan_slug, 'pro')
        self.assertEqual(Account.objects.get(user=demo_enterprise).plan_slug, 'enterprise')
        self.assertTrue(
            UserOrganization.objects.filter(user=demo_starter, organization=starter_org, role='owner').exists()
        )
        self.assertTrue(UserOrganization.objects.filter(user=demo_pro, organization=pro_org, role='owner').exists())
        self.assertTrue(
            UserOrganization.objects.filter(user=demo_enterprise, organization=enterprise_org, role='owner').exists()
        )

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
        )
        UserOrganization.objects.create(user=self.user, organization=self.billing_org, role='owner')
        from core.models import Account
        self.account = Account.objects.create(
            user=self.user,
            plan=_plan('pro'),
            rendered_emails_count=777,
            storage_used_bytes=123456,
        )
        self.account.apply_plan_limits(save=True)

        token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_can_create_update_org_and_reuse_or_refresh_test_api_key(self):
        create_response = self.client.post(
            '/api/v1/site/organizations/',
            {
                'name': 'Second Org',
                'allowed_origins': ['http://localhost:5173'],
                'available_variables': [
                    {'key': 'user_name', 'label': 'User Name', 'defaultValue': 'Guest', 'type': 'text'},
                ],
                'show_logo': False,
                'show_export_html_button': False,
                'theme_mode': 'dark',
                'builder_theme': 'light-paper',
                'email_background_style': 'aurora',
                'email_background_color': '#e2e8f0',
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
        self.assertFalse(create_response.data['organization']['show_logo'])
        self.assertFalse(create_response.data['organization']['show_export_html_button'])
        self.assertEqual(create_response.data['organization']['theme_mode'], 'dark')
        self.assertEqual(create_response.data['organization']['builder_theme'], 'light-paper')
        self.assertEqual(create_response.data['organization']['email_background_style'], 'aurora')
        self.assertEqual(create_response.data['organization']['email_background_color'], '#e2e8f0')
        self.assertEqual(
            create_response.data['organization']['available_variables'],
            [{'key': 'user_name', 'label': 'User Name', 'defaultValue': 'Guest', 'type': 'text'}],
        )

        update_response = self.client.patch(
            f'/api/v1/site/organizations/{org_id}/',
            {
                'name': 'Second Org Updated',
                'allowed_origins': ['http://localhost:5174'],
                'available_variables': [
                    {'key': 'user_email', 'label': 'User Email', 'type': 'text'},
                ],
                'show_logo': True,
                'show_export_html_button': True,
                'theme_mode': 'light',
                'builder_theme': 'dark-cosmos',
                'email_background_style': 'paper-rings',
                'email_background_color': '#f8f6f1',
            },
            format='json',
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data['name'], 'Second Org Updated')
        self.assertEqual(update_response.data['allowed_origins'], ['http://localhost:5174'])
        self.assertEqual(
            update_response.data['available_variables'],
            [{'key': 'user_email', 'label': 'User Email', 'type': 'text'}],
        )
        self.assertTrue(update_response.data['show_logo'])
        self.assertTrue(update_response.data['show_export_html_button'])
        self.assertEqual(update_response.data['theme_mode'], 'light')
        self.assertEqual(update_response.data['builder_theme'], 'dark-cosmos')
        self.assertEqual(update_response.data['email_background_style'], 'paper-rings')
        self.assertEqual(update_response.data['email_background_color'], '#f8f6f1')

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
        )
        UserOrganization.objects.create(user=self.user, organization=secondary_org, role='owner')

        dashboard_response = self.client.get('/api/v1/site/dashboard')
        self.assertEqual(dashboard_response.status_code, 200)
        self.assertEqual(dashboard_response.data['plan'], self.account.plan_slug)
        self.assertEqual(
            dashboard_response.data['rendered_emails_count'],
            self.account.rendered_emails_count,
        )
        self.assertEqual(
            dashboard_response.data['storage_used_bytes'],
            self.account.storage_used_bytes,
        )
        self.assertEqual(dashboard_response.data['organizations_count'], 2)

    def test_api_key_session_uses_billing_org_limits(self):
        secondary_org = Organization.objects.create(
            name='Secondary Org',
            email='secondary-billing@mailcraft.dev',
            allowed_origins=['http://localhost:5173'],
            available_variables=[
                {'key': 'user_name', 'label': 'User Name', 'defaultValue': 'Guest', 'type': 'text'},
                {'key': 'user_email', 'label': 'User Email', 'type': 'text'},
            ],
            show_logo=False,
            show_export_html_button=False,
            theme_mode='dark',
            builder_theme='dark-slate',
            email_background_style='midnight-grid',
            email_background_color='#0f172a',
        )
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
        self.assertEqual(response.data['config']['plan'], self.account.plan_slug)
        self.assertEqual(
            response.data['config']['rendered_emails_limit'],
            self.billing_org.rendered_emails_limit,
        )
        self.assertEqual(
            response.data['config']['max_media_files_per_upload'],
            self.billing_org.max_media_files_per_upload,
        )
        self.assertEqual(
            response.data['config']['variables'],
            [
                {'key': 'user_name', 'label': 'User Name', 'defaultValue': 'Guest', 'type': 'text'},
                {'key': 'user_email', 'label': 'User Email', 'type': 'text'},
            ],
        )
        self.assertEqual(
            response.data['config']['widget_context'],
            {
                'show_logo': False,
                'show_export_html_button': False,
                'theme_mode': 'dark',
                'builder_theme': 'dark-slate',
                'email_background_style': 'midnight-grid',
                'email_background_color': '#0f172a',
            },
        )

    def test_site_login_and_logout(self):
        login_response = self.client.post(
            '/api/v1/site/login',
            {'identifier': self.user.email, 'password': 'owner12345'},
            format='json',
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertIn('token', login_response.data)
        token = login_response.data['token']

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        logout_response = self.client.post('/api/v1/site/logout', {}, format='json')
        self.assertEqual(logout_response.status_code, 204)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_media_list_returns_only_current_org_images(self):
        raw_key = ApiKey.generate_key('test')
        ApiKey.objects.create(
            org=self.billing_org,
            key_hash=ApiKey.hash_key(raw_key),
            key_prefix=raw_key[:12],
            environment='test',
            scope='full',
        )

        other_org = Organization.objects.create(
            name='Other Org',
            email='other-org@mailcraft.dev',
        )

        UploadedImage.objects.create(
            org=self.billing_org,
            s3_key='uploads/billing/first.png',
            url='https://cdn.example.com/uploads/billing/first.png',
            filename='alpha.png',
            file_size=1024,
            content_type='image/png',
        )
        second_image = UploadedImage.objects.create(
            org=self.billing_org,
            s3_key='uploads/billing/second.png',
            url='https://cdn.example.com/uploads/billing/second.png',
            filename='zeta.png',
            file_size=2048,
            content_type='image/png',
        )
        UploadedImage.objects.create(
            org=other_org,
            s3_key='uploads/other/hidden.png',
            url='https://cdn.example.com/uploads/other/hidden.png',
            filename='hidden.png',
            file_size=4096,
            content_type='image/png',
        )

        response = self.client.get('/api/v1/media', HTTP_X_API_KEY=raw_key)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['limit'], 24)
        self.assertEqual(response.data['offset'], 0)
        self.assertFalse(response.data['has_more'])
        self.assertIsNone(response.data['next_offset'])
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['id'], str(second_image.id))
        self.assertEqual(
            response.data['results'][0]['url'],
            'https://cdn.example.com/uploads/billing/second.png',
        )
        self.assertEqual(response.data['results'][0]['filename'], 'zeta.png')

        search_response = self.client.get('/api/v1/media?q=alp', HTTP_X_API_KEY=raw_key)
        self.assertEqual(search_response.status_code, 200)
        self.assertEqual(len(search_response.data['results']), 1)
        self.assertEqual(search_response.data['results'][0]['filename'], 'alpha.png')

        sort_by_size = self.client.get('/api/v1/media?sort=size&order=asc', HTTP_X_API_KEY=raw_key)
        self.assertEqual(sort_by_size.status_code, 200)
        self.assertEqual(sort_by_size.data['results'][0]['filename'], 'alpha.png')

        sort_by_name_desc = self.client.get('/api/v1/media?sort=name&order=desc', HTTP_X_API_KEY=raw_key)
        self.assertEqual(sort_by_name_desc.status_code, 200)
        self.assertEqual(sort_by_name_desc.data['results'][0]['filename'], 'zeta.png')

        paged = self.client.get('/api/v1/media?limit=1&offset=0', HTTP_X_API_KEY=raw_key)
        self.assertEqual(paged.status_code, 200)
        self.assertEqual(len(paged.data['results']), 1)
        self.assertEqual(paged.data['total'], 2)
        self.assertTrue(paged.data['has_more'])
        self.assertEqual(paged.data['next_offset'], 1)

    def test_presign_upload_rejects_too_many_files_for_one_upload(self):
        raw_key = ApiKey.generate_key('test')
        ApiKey.objects.create(
            org=self.billing_org,
            key_hash=ApiKey.hash_key(raw_key),
            key_prefix=raw_key[:12],
            environment='test',
            scope='full',
        )

        response = self.client.post(
            '/api/v1/upload/presign',
            {
                'filename': 'photo.png',
                'content_type': 'image/png',
                'file_size': 1024,
                'upload_batch_size': self.billing_org.max_media_files_per_upload + 1,
            },
            format='json',
            HTTP_X_API_KEY=raw_key,
        )
        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.data['error']['code'], 'TOO_MANY_FILES_IN_UPLOAD')

    def test_create_org_rejects_duplicate_available_variable_keys(self):
        response = self.client.post(
            '/api/v1/site/organizations/',
            {
                'name': 'Duplicate Variable Org',
                'available_variables': [
                    {'key': 'user_name', 'label': 'User Name', 'type': 'text'},
                    {'key': 'user_name', 'label': 'User Name Again', 'type': 'text'},
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error']['code'], 'VALIDATION_ERROR')
        self.assertIn('available_variables', response.data['error']['message'])

    def test_api_templates_are_split_between_user_owned_and_provided(self):
        template_json = {
            'version': 1,
            'settings': {},
            'header': {'blocks': []},
            'body': {'blocks': []},
            'footer': {'blocks': []},
        }
        own_template = Template.objects.create(
            org=self.billing_org,
            name='Owner Template',
            json_data=template_json,
            category='welcome',
        )
        shared_template = Template.objects.create(
            org=None,
            name='Provided Template',
            json_data=template_json,
            category='newsletter',
            is_gallery=True,
        )
        other_org = Organization.objects.create(
            name='Other Org',
            email='other-template-org@mailcraft.dev',
        )
        other_template = Template.objects.create(
            org=other_org,
            name='Other Org Private Template',
            json_data=template_json,
            category='promotional',
        )

        raw_key = ApiKey.generate_key('test')
        ApiKey.objects.create(
            org=self.billing_org,
            key_hash=ApiKey.hash_key(raw_key),
            key_prefix=raw_key[:12],
            environment='test',
            scope='full',
        )

        list_response = self.client.get('/api/v1/templates/', HTTP_X_API_KEY=raw_key)
        self.assertEqual(list_response.status_code, 200)
        self.assertIn('results', list_response.data)
        result_ids = {item['id'] for item in list_response.data['results']}
        self.assertIn(str(own_template.id), result_ids)
        self.assertIn(str(shared_template.id), result_ids)
        self.assertNotIn(str(other_template.id), result_ids)

        by_id = {item['id']: item for item in list_response.data['results']}
        self.assertEqual(by_id[str(own_template.id)]['template_type'], 'user')
        self.assertEqual(by_id[str(shared_template.id)]['template_type'], 'provided')

        shared_detail = self.client.get(f'/api/v1/templates/{shared_template.id}/', HTTP_X_API_KEY=raw_key)
        self.assertEqual(shared_detail.status_code, 200)
        self.assertEqual(shared_detail.data['template_type'], 'provided')

        update_shared = self.client.put(
            f'/api/v1/templates/{shared_template.id}/',
            {'name': 'New Name', 'json_data': template_json, 'category': 'welcome', 'is_draft': False},
            format='json',
            HTTP_X_API_KEY=raw_key,
        )
        self.assertEqual(update_shared.status_code, 404)

        delete_shared = self.client.delete(f'/api/v1/templates/{shared_template.id}/', HTTP_X_API_KEY=raw_key)
        self.assertEqual(delete_shared.status_code, 404)

    def test_site_templates_include_provided_templates_as_read_only(self):
        template_json = {
            'version': 1,
            'settings': {},
            'header': {'blocks': []},
            'body': {'blocks': []},
            'footer': {'blocks': []},
        }
        own_template = Template.objects.create(
            org=self.billing_org,
            name='Site Owner Template',
            json_data=template_json,
            category='welcome',
        )
        shared_template = Template.objects.create(
            org=None,
            name='Site Shared Template',
            json_data=template_json,
            category='newsletter',
            is_gallery=True,
        )
        other_org = Organization.objects.create(
            name='Other Site Org',
            email='other-site-org@mailcraft.dev',
        )
        other_template = Template.objects.create(
            org=other_org,
            name='Hidden Template',
            json_data=template_json,
            category='event',
        )

        list_response = self.client.get('/api/v1/site/templates/')
        self.assertEqual(list_response.status_code, 200)
        result_ids = {item['id'] for item in list_response.data['results']}
        self.assertIn(str(own_template.id), result_ids)
        self.assertIn(str(shared_template.id), result_ids)
        self.assertNotIn(str(other_template.id), result_ids)

        by_id = {item['id']: item for item in list_response.data['results']}
        self.assertEqual(by_id[str(own_template.id)]['template_type'], 'user')
        self.assertEqual(by_id[str(shared_template.id)]['template_type'], 'provided')

        detail_response = self.client.get(f'/api/v1/site/templates/{shared_template.id}/')
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data['template_type'], 'provided')

        update_response = self.client.put(
            f'/api/v1/site/templates/{shared_template.id}/',
            {'name': 'Attempt Update', 'json_data': template_json, 'category': 'welcome', 'is_draft': False},
            format='json',
        )
        self.assertEqual(update_response.status_code, 403)
        self.assertEqual(update_response.data['error']['code'], 'FORBIDDEN')

        delete_response = self.client.delete(f'/api/v1/site/templates/{shared_template.id}/')
        self.assertEqual(delete_response.status_code, 403)
