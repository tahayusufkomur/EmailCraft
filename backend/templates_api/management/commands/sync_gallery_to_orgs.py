from django.core.management.base import BaseCommand

from core.models import Organization
from templates_api.models import Template
from templates_api.services import provision_templates_for_org


class Command(BaseCommand):
    help = 'Sync gallery templates to all active organizations'

    def handle(self, *args, **options):
        gallery_templates = {t.id: t for t in Template.objects.shared()}
        if not gallery_templates:
            self.stdout.write('No gallery templates found. Nothing to sync.')
            return

        orgs = Organization.objects.filter(is_active=True)
        total_orgs = orgs.count()
        synced = 0

        for org in orgs.iterator():
            provision_templates_for_org(org)

            copies = Template.objects.for_org(org).filter(
                source_template__isnull=False,
                is_modified=False,
            )
            for copy in copies:
                gallery = gallery_templates.get(copy.source_template_id)
                if not gallery:
                    continue
                changed = False
                for field in ('name', 'json_data', 'category', 'tags', 'is_premium', 'thumbnail_url'):
                    gallery_val = getattr(gallery, field)
                    if getattr(copy, field) != gallery_val:
                        setattr(copy, field, gallery_val)
                        changed = True
                if changed:
                    copy.save(update_fields=[
                        'name', 'json_data', 'category', 'tags',
                        'is_premium', 'thumbnail_url', 'updated_at',
                    ])

            synced += 1

        self.stdout.write(self.style.SUCCESS(
            f'Synced gallery templates to {synced}/{total_orgs} organizations.'
        ))
