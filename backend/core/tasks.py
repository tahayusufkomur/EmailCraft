from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_transactional_email(self, to_email, subject, template_name, context):
    """Render a branded email template and send via the configured backend."""
    html = render_to_string(f'emails/{template_name}.html', context)
    plain = strip_tags(html)
    try:
        send_mail(
            subject=subject,
            message=plain,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html,
        )
    except Exception as exc:
        raise self.retry(exc=exc)
