import logging

from celery import shared_task
from celery.exceptions import MaxRetriesExceededError, SoftTimeLimitExceeded
from django.db import transaction
from django.db.models import F

from core.agent_hub import HubError, HubHold
from core.models import Account, Plan, account_for_org
from templates_api.generation import edit_template, generate_template
from templates_api.models import GenerationJob, Template


logger = logging.getLogger(__name__)

JOB_TIME_LIMIT_S = 960  # a job not updated for this long is dead; it no longer blocks its org


def _user_error(exc) -> str:
    """Fixed, user-safe message per failure class; never echo exception text to the client."""
    if isinstance(exc, HubError):
        return 'AI worker error, try again'
    if isinstance(exc, ValueError):
        return 'The AI reply was not a valid template, try again'
    if isinstance(exc, SoftTimeLimitExceeded):
        return 'Generation took too long, try again'
    return 'Generation failed'


@shared_task(bind=True, max_retries=10, soft_time_limit=900, time_limit=JOB_TIME_LIMIT_S)
def run_generation_job(self, job_id):
    job = GenerationJob.objects.select_related('org').get(pk=job_id)
    if job.status == 'done':  # redelivery: don't create a second template or double-count
        return
    job.status = 'running'
    job.error = ''
    job.save(update_fields=['status', 'error', 'updated_at'])

    def on_progress(**fields):
        for name, value in fields.items():
            setattr(job, name, value)
        job.save(update_fields=[*fields, 'updated_at'])

    try:
        account = account_for_org(job.org)
        allow_images = False
        if account:
            plan = account.plan or Plan.get_default()
            allow_images = bool(plan and plan.allow_ai_image_generation)

        if job.kind == 'edit':  # edits are free: they return the email and touch no quota or template row
            job.result, job.warnings = edit_template(
                job.source, job.brief, job.org, block_id=job.block_id,
                allow_generation=allow_images, on_progress=on_progress,
            )
            job.status, job.partial = 'done', None
            job.save(update_fields=['result', 'warnings', 'status', 'partial', 'updated_at'])
            return

        name, template, warnings, category = generate_template(
            job.brief, job.category, job.org, allow_generation=allow_images, on_progress=on_progress,
        )
        with transaction.atomic():
            job.template = Template.objects.create(
                org=job.org, name=name[:255], json_data=template, category=category,
                is_draft=False, is_gallery=False,
            )
            job.warnings = warnings
            job.status, job.partial = 'done', None
            job.save(update_fields=['template', 'warnings', 'status', 'partial', 'updated_at'])
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
        job.partial = None
        job.save(update_fields=['status', 'error', 'template', 'partial', 'updated_at'])
