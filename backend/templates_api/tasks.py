import logging

from celery import shared_task
from celery.exceptions import MaxRetriesExceededError, SoftTimeLimitExceeded
from django.db import transaction
from django.db.models import F

from core.agent_hub import HubError, HubHold
from core.models import Account, Plan, account_for_org
from templates_api.generation import generate_template
from templates_api.models import GenerationJob, Template


logger = logging.getLogger(__name__)


def _user_error(exc) -> str:
    """Fixed, user-safe message per failure class; never echo exception text to the client."""
    if isinstance(exc, HubError):
        return 'AI worker error, try again'
    if isinstance(exc, ValueError):
        return 'The AI reply was not a valid template, try again'
    if isinstance(exc, SoftTimeLimitExceeded):
        return 'Generation took too long, try again'
    return 'Generation failed'


@shared_task(bind=True, max_retries=10, soft_time_limit=900, time_limit=960)
def run_generation_job(self, job_id):
    job = GenerationJob.objects.select_related('org').get(pk=job_id)
    if job.status == 'done':  # redelivery: don't create a second template or double-count
        return
    job.status = 'running'
    job.error = ''
    job.save(update_fields=['status', 'error', 'updated_at'])

    def on_step(step):
        job.step = step
        job.save(update_fields=['step', 'updated_at'])

    try:
        account = account_for_org(job.org)
        allow_images = False
        if account:
            plan = account.plan or Plan.get_default()
            allow_images = bool(plan and plan.allow_ai_image_generation)

        name, template, warnings = generate_template(
            job.brief, job.category, job.org, allow_generation=allow_images, on_step=on_step,
        )
        with transaction.atomic():
            job.template = Template.objects.create(
                org=job.org, name=name[:255], json_data=template, category=job.category,
                is_draft=False, is_gallery=False,
            )
            job.warnings = warnings
            job.status = 'done'
            job.save(update_fields=['template', 'warnings', 'status', 'updated_at'])
            if account:
                Account.objects.filter(pk=account.pk).update(
                    ai_generations_count=F('ai_generations_count') + 1)
    except HubHold as hold:
        job.status = 'queued'
        job.error = hold.reason
        job.save(update_fields=['status', 'error', 'updated_at'])
        try:
            raise self.retry(countdown=30)
        except MaxRetriesExceededError:
            job.status = 'failed'
            job.error = 'AI workers unavailable, try again later'
            job.save(update_fields=['status', 'error', 'updated_at'])
    except Exception as exc:
        job.status = 'failed'
        logger.exception('generation job %s failed', job.id)
        job.error = _user_error(exc)
        job.template = None
        job.save(update_fields=['status', 'error', 'template', 'updated_at'])
