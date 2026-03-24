import resend
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend


class ResendEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        resend.api_key = settings.RESEND_API_KEY
        sent = 0
        for msg in email_messages:
            try:
                resend.Emails.send({
                    'from': msg.from_email,
                    'to': list(msg.to),
                    'subject': msg.subject,
                    'text': msg.body,
                })
                sent += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return sent
