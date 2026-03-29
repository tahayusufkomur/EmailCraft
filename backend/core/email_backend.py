import resend
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend


class ResendEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        resend.api_key = settings.RESEND_API_KEY
        sent = 0
        for msg in email_messages:
            try:
                payload = {
                    'from': msg.from_email,
                    'to': list(msg.to),
                    'subject': msg.subject,
                }

                # Check for HTML alternative (set by send_mail html_message param)
                html_body = None
                for content, mimetype in getattr(msg, 'alternatives', []):
                    if mimetype == 'text/html':
                        html_body = content
                        break

                if html_body:
                    payload['html'] = html_body
                if msg.body:
                    payload['text'] = msg.body

                resend.Emails.send(payload)
                sent += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return sent
