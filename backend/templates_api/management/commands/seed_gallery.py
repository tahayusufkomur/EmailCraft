import json
from pathlib import Path

from django.core.management.base import BaseCommand

from templates_api.models import Template


class Command(BaseCommand):
    help = 'Seed gallery templates from templates/*/*.json (org=None, is_gallery=True)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing gallery templates before seeding',
        )

    def handle(self, *args, **options):
        entries = []
        templates_dir = Path(__file__).resolve().parent.parent.parent / 'templates'
        if templates_dir.exists():
            for json_path in sorted(templates_dir.rglob('*.json')):
                with open(json_path, 'r') as f:
                    entry = json.load(f)
                if not isinstance(entry, dict) or 'template' not in entry:
                    continue
                entry['_source_category'] = json_path.parent.name
                entries.append(entry)

        if not entries:
            json_path = Path(__file__).resolve().parent.parent.parent / 'templates.json'
            if not json_path.exists():
                raise FileNotFoundError(f'templates.json not found at {json_path}')

            with open(json_path, 'r') as f:
                entries = json.load(f)

        if options['clear']:
            deleted, _ = Template.objects.shared().delete()
            self.stdout.write(f'Deleted {deleted} existing gallery templates.')

        created = 0
        updated = 0
        for entry in entries:
            raw_tags = entry.get('tags') or []
            if not isinstance(raw_tags, list):
                raw_tags = []
            category = entry.get('category') or entry.get('_source_category', '')
            normalized_tags = [t for t in raw_tags if isinstance(t, str) and t.strip()]
            if category and category not in normalized_tags:
                normalized_tags.insert(0, category)
            _, was_created = Template.objects.update_or_create(
                org=None,
                name=entry['name'],
                defaults={
                    'json_data': entry['template'],
                    'category': category,
                    'is_gallery': True,
                    'is_premium': bool(entry.get('is_premium', False)),
                    'tags': normalized_tags,
                    'is_draft': False,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'Gallery seeded: {created} created, {updated} updated ({len(entries)} total)'
        ))
