from django.core.management.base import BaseCommand

from core.agent_hub import HubHold
from templates_api.generation import generate_template
from templates_api.models import Template


class Command(BaseCommand):
    help = 'Generate draft gallery templates with the AI agent (org=None, is_gallery=True, is_draft=True)'

    def add_arguments(self, parser):
        parser.add_argument('--category', required=True, choices=[c for c, _ in Template.CATEGORY_CHOICES])
        parser.add_argument('--count', type=int, default=1)
        parser.add_argument('--brief', default='')
        parser.add_argument('--no-generate', action='store_true', help='Only use existing pix4less images')

    def handle(self, *args, **options):
        category = options['category']
        brief = options['brief'] or f'A {category} email for a modern brand; pick a distinct industry and tone.'
        for _ in range(options['count']):
            try:
                name, template, warnings, _ = generate_template(
                    brief, category, None, allow_generation=not options['no_generate'])
            except HubHold as e:
                self.stdout.write(f'Hub is holding the lane: {e.reason}')
                return
            except Exception as e:
                self.stdout.write(f'Error: {e}')
                continue
            Template.objects.create(
                org=None, is_gallery=True, is_draft=True, category=category, name=name,
                json_data=template, tags=[category, 'foundry'],
            )
            self.stdout.write(name)
            for w in warnings:
                self.stdout.write(f'  warning: {w}')
