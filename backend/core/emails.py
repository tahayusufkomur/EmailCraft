from core.tasks import send_transactional_email

_BASE_URL = None


def _base_url():
    global _BASE_URL
    if _BASE_URL is None:
        from core.views import _get_base_url
        _BASE_URL = _get_base_url()
    return _BASE_URL


def _billing_url():
    return f'{_base_url()}/dashboard/billing'


def _dashboard_url():
    return f'{_base_url()}/dashboard'


def send_welcome_email(user):
    send_transactional_email.delay(
        to_email=user.email,
        subject='Welcome to MailCraft',
        template_name='welcome',
        context={
            'username': user.username,
            'dashboard_url': _dashboard_url(),
        },
    )


def send_magic_link_email(email, verify_url):
    send_transactional_email.delay(
        to_email=email,
        subject='Sign in to MailCraft',
        template_name='magic_link',
        context={'verify_url': verify_url},
    )


def send_plan_upgraded_email(user, plan_name, rendered_emails_limit, storage_limit):
    send_transactional_email.delay(
        to_email=user.email,
        subject=f'Your plan has been upgraded to {plan_name}',
        template_name='plan_upgraded',
        context={
            'plan_name': plan_name,
            'rendered_emails_limit': str(rendered_emails_limit),
            'storage_limit': storage_limit,
            'billing_url': _billing_url(),
        },
    )


def send_downgrade_scheduled_email(user, current_plan_name, pending_plan_name):
    send_transactional_email.delay(
        to_email=user.email,
        subject=f'Your plan change to {pending_plan_name} is scheduled',
        template_name='plan_downgrade_scheduled',
        context={
            'current_plan_name': current_plan_name,
            'pending_plan_name': pending_plan_name,
            'billing_url': _billing_url(),
        },
    )


def send_plan_activated_email(user, plan_name):
    send_transactional_email.delay(
        to_email=user.email,
        subject=f'Your {plan_name} plan is now active',
        template_name='plan_activated',
        context={
            'plan_name': plan_name,
            'billing_url': _billing_url(),
        },
    )


def send_payment_failed_email(user, plan_name, attempt_count):
    send_transactional_email.delay(
        to_email=user.email,
        subject='Action required: payment failed',
        template_name='payment_failed',
        context={
            'plan_name': plan_name,
            'attempt_count': attempt_count,
            'billing_url': _billing_url(),
        },
    )


def send_org_created_email(user, org_name):
    send_transactional_email.delay(
        to_email=user.email,
        subject=f'Organization "{org_name}" created',
        template_name='org_created',
        context={
            'org_name': org_name,
            'dashboard_url': _dashboard_url(),
        },
    )


def send_api_key_created_email(user, org_name, key_prefix):
    send_transactional_email.delay(
        to_email=user.email,
        subject=f'New API key created for {org_name}',
        template_name='api_key_created',
        context={
            'org_name': org_name,
            'key_prefix': key_prefix,
        },
    )


def send_usage_warning_email(user, rendered_count, rendered_limit):
    percentage = int((rendered_count / rendered_limit) * 100) if rendered_limit else 0
    send_transactional_email.delay(
        to_email=user.email,
        subject="You've used 80% of your monthly emails",
        template_name='usage_warning',
        context={
            'rendered_count': str(rendered_count),
            'rendered_limit': str(rendered_limit),
            'percentage': str(percentage),
            'billing_url': _billing_url(),
        },
    )


def send_usage_limit_reached_email(user, rendered_limit):
    send_transactional_email.delay(
        to_email=user.email,
        subject='Monthly email limit reached',
        template_name='usage_limit_reached',
        context={
            'rendered_limit': str(rendered_limit),
            'billing_url': _billing_url(),
        },
    )
