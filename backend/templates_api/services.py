from core.models import account_for_org
from templates_api.models import Template


def provision_templates_for_org(org):
    """Clone gallery templates into an org's namespace, respecting plan access."""
    account = account_for_org(org)
    is_pro = account.is_pro if account else False

    gallery_templates = list(Template.objects.shared())
    existing_copies = {
        t.source_template_id: t
        for t in Template.objects.for_org(org).filter(source_template__isnull=False)
    }

    to_create = []
    to_update = []

    for gallery in gallery_templates:
        should_lock = gallery.is_premium and not is_pro
        copy = existing_copies.get(gallery.id)

        if copy:
            if copy.is_locked != should_lock:
                copy.is_locked = should_lock
                to_update.append(copy)
        else:
            to_create.append(Template(
                org=org,
                name=gallery.name,
                json_data=gallery.json_data,
                thumbnail_url=gallery.thumbnail_url,
                category=gallery.category,
                is_premium=gallery.is_premium,
                tags=list(gallery.tags) if gallery.tags else [],
                is_gallery=False,
                is_draft=False,
                is_modified=False,
                is_locked=should_lock,
                source_template=gallery,
            ))

    if to_create:
        Template.objects.bulk_create(to_create)
    if to_update:
        Template.objects.bulk_update(to_update, ['is_locked'])
