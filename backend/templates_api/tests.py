from django.test import TestCase

from templates_api.export_engine import (
    extract_variable_keys,
    render_email_html,
    substitute_variables,
    validate_variable_key,
)


def _template(blocks, section='body'):
    """Helper to wrap blocks in a minimal template JSON structure."""
    return {
        'settings': {
            'backgroundColor': '#ffffff',
            'contentWidth': 600,
            'defaultFont': 'Arial, sans-serif',
            'defaultFontSize': 14,
            'defaultColor': '#333333',
        },
        'header': {'blocks': []},
        'body': {'blocks': blocks if section == 'body' else []},
        'footer': {'blocks': blocks if section == 'footer' else []},
    }


# ---------------------------------------------------------------------------
# Variable key validation
# ---------------------------------------------------------------------------

class TestValidateVariableKey(TestCase):
    def test_valid_keys(self):
        self.assertTrue(validate_variable_key('user_name'))
        self.assertTrue(validate_variable_key('coupon_code'))
        self.assertTrue(validate_variable_key('_private'))
        self.assertTrue(validate_variable_key('X'))
        self.assertTrue(validate_variable_key('item123'))

    def test_invalid_keys(self):
        self.assertFalse(validate_variable_key(''))
        self.assertFalse(validate_variable_key('123abc'))
        self.assertFalse(validate_variable_key('user-name'))
        self.assertFalse(validate_variable_key('user.name'))
        self.assertFalse(validate_variable_key('has space'))


# ---------------------------------------------------------------------------
# Variable extraction
# ---------------------------------------------------------------------------

class TestVariableExtraction(TestCase):
    def test_extract_from_text_block(self):
        blocks = [{'type': 'text', 'data': {'html': '<p>Hello {{user_name}}</p>'}, 'style': {}}]
        keys = extract_variable_keys(_template(blocks))
        self.assertEqual(keys, {'user_name'})

    def test_extract_from_button_block(self):
        blocks = [{'type': 'button', 'data': {'text': 'Buy {{product}}', 'url': 'https://x.com?code={{coupon}}'}, 'style': {}}]
        keys = extract_variable_keys(_template(blocks))
        self.assertEqual(keys, {'product', 'coupon'})

    def test_extract_from_heading_block(self):
        blocks = [{'type': 'heading', 'data': {'text': 'Welcome {{user_name}}!', 'level': 2}, 'style': {}}]
        keys = extract_variable_keys(_template(blocks))
        self.assertEqual(keys, {'user_name'})

    def test_extract_from_image_block(self):
        blocks = [{'type': 'image', 'data': {'src': 'pic.png', 'alt': 'Photo of {{user_name}}', 'link': 'https://x.com/{{user_id}}', 'width': 200}, 'style': {}}]
        keys = extract_variable_keys(_template(blocks))
        self.assertEqual(keys, {'user_name', 'user_id'})

    def test_extract_from_html_block(self):
        blocks = [{'type': 'html', 'data': {'html': '<div>{{custom_content}}</div>'}, 'style': {}}]
        keys = extract_variable_keys(_template(blocks))
        self.assertEqual(keys, {'custom_content'})

    def test_extract_from_columns_recursively(self):
        blocks = [{
            'type': 'columns',
            'data': {
                'columnCount': 2,
                'columnRatio': [50, 50],
                'columns': [
                    {'id': 'c1', 'blocks': [{'type': 'text', 'data': {'html': '{{col_var}}'}, 'style': {}}]},
                    {'id': 'c2', 'blocks': [{'type': 'heading', 'data': {'text': '{{heading_var}}', 'level': 1}, 'style': {}}]},
                ],
            },
            'style': {},
        }]
        keys = extract_variable_keys(_template(blocks))
        self.assertEqual(keys, {'col_var', 'heading_var'})

    def test_deduplicates_keys(self):
        blocks = [
            {'type': 'text', 'data': {'html': '{{name}} and {{name}}'}, 'style': {}},
            {'type': 'heading', 'data': {'text': '{{name}}', 'level': 1}, 'style': {}},
        ]
        keys = extract_variable_keys(_template(blocks))
        self.assertEqual(keys, {'name'})

    def test_no_variables(self):
        blocks = [{'type': 'text', 'data': {'html': '<p>No variables here</p>'}, 'style': {}}]
        keys = extract_variable_keys(_template(blocks))
        self.assertEqual(keys, set())

    def test_ignores_non_variable_blocks(self):
        blocks = [
            {'type': 'divider', 'data': {}, 'style': {}},
            {'type': 'spacer', 'data': {}, 'style': {}},
            {'type': 'social', 'data': {'platforms': []}, 'style': {}},
        ]
        keys = extract_variable_keys(_template(blocks))
        self.assertEqual(keys, set())

    def test_extract_across_sections(self):
        data = {
            'settings': {},
            'header': {'blocks': [{'type': 'text', 'data': {'html': '{{header_var}}'}, 'style': {}}]},
            'body': {'blocks': [{'type': 'text', 'data': {'html': '{{body_var}}'}, 'style': {}}]},
            'footer': {'blocks': [{'type': 'text', 'data': {'html': '{{footer_var}}'}, 'style': {}}]},
        }
        keys = extract_variable_keys(data)
        self.assertEqual(keys, {'header_var', 'body_var', 'footer_var'})


# ---------------------------------------------------------------------------
# Variable substitution
# ---------------------------------------------------------------------------

class TestVariableSubstitution(TestCase):
    def test_substitutes_text_block_html_escaped(self):
        blocks = [{'type': 'text', 'data': {'html': '<p>Hello {{user_name}}</p>'}, 'style': {}}]
        result = substitute_variables(_template(blocks), {'user_name': '<script>alert(1)</script>'})
        html = result['body']['blocks'][0]['data']['html']
        self.assertIn('&lt;script&gt;alert(1)&lt;/script&gt;', html)
        self.assertNotIn('<script>', html)

    def test_substitutes_heading_text_raw(self):
        blocks = [{'type': 'heading', 'data': {'text': 'Hi {{user_name}}', 'level': 2}, 'style': {}}]
        result = substitute_variables(_template(blocks), {'user_name': 'John'})
        self.assertEqual(result['body']['blocks'][0]['data']['text'], 'Hi John')

    def test_substitutes_button_text_and_url(self):
        blocks = [{'type': 'button', 'data': {'text': 'Buy {{product}}', 'url': 'https://x.com?code={{coupon}}'}, 'style': {}}]
        result = substitute_variables(_template(blocks), {'product': 'Widget', 'coupon': 'SAVE20'})
        data = result['body']['blocks'][0]['data']
        self.assertEqual(data['text'], 'Buy Widget')
        self.assertEqual(data['url'], 'https://x.com?code=SAVE20')

    def test_substitutes_image_alt_and_link(self):
        blocks = [{'type': 'image', 'data': {'src': 'pic.png', 'alt': '{{alt_text}}', 'link': 'https://x.com/{{user_id}}', 'width': 200}, 'style': {}}]
        result = substitute_variables(_template(blocks), {'alt_text': 'Profile', 'user_id': '42'})
        data = result['body']['blocks'][0]['data']
        self.assertEqual(data['alt'], 'Profile')
        self.assertEqual(data['link'], 'https://x.com/42')

    def test_substitutes_html_block_escaped(self):
        blocks = [{'type': 'html', 'data': {'html': '<div>{{content}}</div>'}, 'style': {}}]
        result = substitute_variables(_template(blocks), {'content': '<b>Bold</b>'})
        html = result['body']['blocks'][0]['data']['html']
        self.assertIn('&lt;b&gt;Bold&lt;/b&gt;', html)

    def test_substitutes_in_columns(self):
        blocks = [{
            'type': 'columns',
            'data': {
                'columnCount': 2,
                'columnRatio': [50, 50],
                'columns': [
                    {'id': 'c1', 'blocks': [{'type': 'text', 'data': {'html': '{{greeting}}'}, 'style': {}}]},
                    {'id': 'c2', 'blocks': []},
                ],
            },
            'style': {},
        }]
        result = substitute_variables(_template(blocks), {'greeting': 'Hello!'})
        inner_html = result['body']['blocks'][0]['data']['columns'][0]['blocks'][0]['data']['html']
        self.assertEqual(inner_html, 'Hello!')

    def test_no_recursive_substitution(self):
        blocks = [{'type': 'text', 'data': {'html': '{{name}}'}, 'style': {}}]
        result = substitute_variables(_template(blocks), {'name': '{{other}}'})
        html = result['body']['blocks'][0]['data']['html']
        # The value contains {{other}} literal (HTML-escaped braces)
        self.assertNotIn('other_value', html)

    def test_leaves_unknown_variables(self):
        blocks = [{'type': 'text', 'data': {'html': '{{known}} and {{unknown}}'}, 'style': {}}]
        result = substitute_variables(_template(blocks), {'known': 'yes'})
        html = result['body']['blocks'][0]['data']['html']
        self.assertIn('yes', html)
        self.assertIn('{{unknown}}', html)

    def test_does_not_mutate_original(self):
        blocks = [{'type': 'text', 'data': {'html': '{{name}}'}, 'style': {}}]
        original = _template(blocks)
        substitute_variables(original, {'name': 'John'})
        self.assertEqual(original['body']['blocks'][0]['data']['html'], '{{name}}')


class TestTemplateBackgroundStyles(TestCase):
    def test_background_style_renders_gradient_wrapper(self):
        data = _template([])
        data['settings']['backgroundStyle'] = 'aurora'
        data['settings']['backgroundColor'] = '#e2e8f0'

        result = render_email_html(data)
        html = result['html']

        self.assertIn('background-color: #e2e8f0;', html)
        self.assertIn('radial-gradient(circle at 15% 15%', html)
        self.assertIn('linear-gradient(135deg, #f6f7ff 0%, #e0e7ff 45%, #dbeafe 100%)', html)

    def test_unknown_background_style_falls_back_to_background_color(self):
        data = _template([])
        data['settings']['backgroundStyle'] = 'unknown-style'
        data['settings']['backgroundColor'] = '#abc123'

        result = render_email_html(data)
        html = result['html']

        self.assertIn('background-color: #abc123;', html)
        self.assertIn('background: #abc123;', html)

    def test_body_background_style_renders_on_content_table(self):
        data = _template([])
        data['settings']['bodyBackgroundStyle'] = 'mesh-blue'
        data['settings']['bodyBackgroundColor'] = '#eef4ff'

        result = render_email_html(data)
        html = result['html']

        self.assertIn('background-color: #eef4ff;', html)
        self.assertIn('linear-gradient(145deg, #f8fbff 0%, #eef4ff 48%, #e5edff 100%)', html)

    def test_unknown_body_background_style_falls_back_to_solid_color(self):
        data = _template([])
        data['settings']['bodyBackgroundStyle'] = 'not-real'
        data['settings']['bodyBackgroundColor'] = '#fafafa'

        result = render_email_html(data)
        html = result['html']

        self.assertIn('background-color: #fafafa;', html)
        self.assertIn('background: #fafafa;', html)


from django.contrib.auth.models import User
from django.core.management import call_command
from io import StringIO
from core.models import Account, Organization, Plan, UserOrganization
from templates_api.models import Template


class TestProvisionTemplatesForOrg(TestCase):
    def setUp(self):
        self.free_plan, _ = Plan.objects.get_or_create(
            slug='free',
            defaults={'name': 'Free', 'monthly_price_usd': 0, 'is_default': True, 'sort_order': 0},
        )
        self.pro_plan, _ = Plan.objects.get_or_create(
            slug='pro',
            defaults={'name': 'Pro', 'monthly_price_usd': 29, 'sort_order': 1},
        )
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.org = Organization.objects.create(name='Test Org', email='test@example.com')
        UserOrganization.objects.create(user=self.user, organization=self.org, role='owner')
        self.account = Account.objects.create(user=self.user, plan=self.free_plan)

        self.gallery_free = Template.objects.create(
            org=None, name='Free Welcome', json_data={'version': 1},
            is_gallery=True, is_premium=False, category='welcome',
        )
        self.gallery_premium = Template.objects.create(
            org=None, name='Premium Newsletter', json_data={'version': 1},
            is_gallery=True, is_premium=True, category='newsletter',
        )

    def test_provisions_free_templates_for_free_plan(self):
        from templates_api.services import provision_templates_for_org
        provision_templates_for_org(self.org)
        copies = Template.objects.for_org(self.org).filter(source_template__isnull=False)
        self.assertEqual(copies.count(), 2)
        free_copy = copies.get(source_template=self.gallery_free)
        self.assertFalse(free_copy.is_locked)
        self.assertFalse(free_copy.is_modified)
        premium_copy = copies.get(source_template=self.gallery_premium)
        self.assertTrue(premium_copy.is_locked)

    def test_provisions_all_templates_for_pro_plan(self):
        from templates_api.services import provision_templates_for_org
        self.account.plan = self.pro_plan
        self.account.save()
        provision_templates_for_org(self.org)
        copies = Template.objects.for_org(self.org).filter(source_template__isnull=False)
        self.assertEqual(copies.count(), 2)
        self.assertFalse(copies.filter(is_locked=True).exists())

    def test_upgrade_unlocks_premium_copies(self):
        from templates_api.services import provision_templates_for_org
        provision_templates_for_org(self.org)
        premium_copy = Template.objects.for_org(self.org).get(source_template=self.gallery_premium)
        self.assertTrue(premium_copy.is_locked)
        self.account.plan = self.pro_plan
        self.account.save()
        provision_templates_for_org(self.org)
        premium_copy.refresh_from_db()
        self.assertFalse(premium_copy.is_locked)

    def test_downgrade_locks_premium_copies(self):
        from templates_api.services import provision_templates_for_org
        self.account.plan = self.pro_plan
        self.account.save()
        provision_templates_for_org(self.org)
        premium_copy = Template.objects.for_org(self.org).get(source_template=self.gallery_premium)
        self.assertFalse(premium_copy.is_locked)
        self.account.plan = self.free_plan
        self.account.save()
        provision_templates_for_org(self.org)
        premium_copy.refresh_from_db()
        self.assertTrue(premium_copy.is_locked)

    def test_idempotent_no_duplicates(self):
        from templates_api.services import provision_templates_for_org
        provision_templates_for_org(self.org)
        provision_templates_for_org(self.org)
        copies = Template.objects.for_org(self.org).filter(source_template__isnull=False)
        self.assertEqual(copies.count(), 2)

    def test_cloned_fields_match_gallery_original(self):
        from templates_api.services import provision_templates_for_org
        provision_templates_for_org(self.org)
        copy = Template.objects.for_org(self.org).get(source_template=self.gallery_free)
        self.assertEqual(copy.name, self.gallery_free.name)
        self.assertEqual(copy.json_data, self.gallery_free.json_data)
        self.assertEqual(copy.category, self.gallery_free.category)
        self.assertEqual(copy.is_premium, self.gallery_free.is_premium)
        self.assertFalse(copy.is_gallery)
        self.assertFalse(copy.is_draft)


class TestSyncGalleryToOrgs(TestCase):
    def setUp(self):
        self.free_plan, _ = Plan.objects.get_or_create(
            slug='free', defaults={'name': 'Free', 'monthly_price_usd': 0, 'is_default': True, 'sort_order': 0},
        )
        self.user = User.objects.create_user(username='syncuser', password='pass')
        self.org = Organization.objects.create(name='Sync Org', email='sync@example.com')
        UserOrganization.objects.create(user=self.user, organization=self.org, role='owner')
        Account.objects.create(user=self.user, plan=self.free_plan)

        self.gallery = Template.objects.create(
            org=None, name='Gallery Template', json_data={'version': 1, 'body': 'original'},
            is_gallery=True, is_premium=False, category='welcome',
        )

    def test_sync_creates_copies_for_orgs(self):
        out = StringIO()
        call_command('sync_gallery_to_orgs', stdout=out)
        copies = Template.objects.for_org(self.org).filter(source_template=self.gallery)
        self.assertEqual(copies.count(), 1)

    def test_sync_updates_unmodified_copies(self):
        from templates_api.services import provision_templates_for_org
        provision_templates_for_org(self.org)
        self.gallery.json_data = {'version': 2, 'body': 'updated'}
        self.gallery.name = 'Updated Gallery Template'
        self.gallery.save()

        out = StringIO()
        call_command('sync_gallery_to_orgs', stdout=out)

        copy = Template.objects.for_org(self.org).get(source_template=self.gallery)
        self.assertEqual(copy.json_data, {'version': 2, 'body': 'updated'})
        self.assertEqual(copy.name, 'Updated Gallery Template')

    def test_sync_preserves_modified_copies(self):
        from templates_api.services import provision_templates_for_org
        provision_templates_for_org(self.org)
        copy = Template.objects.for_org(self.org).get(source_template=self.gallery)
        copy.json_data = {'version': 1, 'body': 'custom'}
        copy.is_modified = True
        copy.save()

        self.gallery.json_data = {'version': 2, 'body': 'updated'}
        self.gallery.save()

        out = StringIO()
        call_command('sync_gallery_to_orgs', stdout=out)

        copy.refresh_from_db()
        self.assertEqual(copy.json_data, {'version': 1, 'body': 'custom'})
