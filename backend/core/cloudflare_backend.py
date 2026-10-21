"""Django email backend for Cloudflare Email Sending (REST API).

Drop-in replacement for SMTP/Resend backends across the fleet's Django apps
(gorkemHanciYoga, mailcraft, veterinerimiBul, professionalMeApp, contentor).

Settings required:
    EMAIL_BACKEND = "<app_path>.cloudflare_email_backend.CloudflareEmailBackend"
    CF_ACCOUNT_ID = os.environ["CF_ACCOUNT_ID"]          # e39fec2962432f6048f5c41ac411c7b8
    CF_EMAIL_TOKEN = os.environ["CF_EMAIL_TOKEN"]        # per-project scoped token
    DEFAULT_FROM_EMAIL = "..."                           # must be on an onboarded domain

Stdlib-only (urllib) — no new pip dependency. REST gotchas honoured:
`from.address` (not `email`), `reply_to` snake_case, retry only on 429/5xx.
"""

import base64
import json
import time
import urllib.error
import urllib.request
from email.utils import parseaddr

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

API_URL = "https://api.cloudflare.com/client/v4/accounts/{account_id}/email/sending/send"
RETRIES = 2  # additional attempts on 429/5xx only
RETRY_SLEEP = 2.0


class CloudflareEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        account_id = getattr(settings, "CF_ACCOUNT_ID", "")
        token = getattr(settings, "CF_EMAIL_TOKEN", "")
        if not account_id or not token:
            if self.fail_silently:
                return 0
            raise RuntimeError("CloudflareEmailBackend requires CF_ACCOUNT_ID and CF_EMAIL_TOKEN settings")

        url = API_URL.format(account_id=account_id)
        sent = 0
        for msg in email_messages:
            try:
                self._send_one(url, token, msg)
                sent += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return sent

    def _send_one(self, url, token, msg):
        # from_email may be a bare address or "Display Name <addr@domain>".
        from_name, from_addr = parseaddr(msg.from_email or "")
        sender = {"address": from_addr or msg.from_email}
        if from_name:
            sender["name"] = from_name
        payload = {
            "from": sender,
            "to": list(msg.to),
            "subject": msg.subject or "",
        }
        if msg.cc:
            payload["cc"] = list(msg.cc)
        if msg.bcc:
            payload["bcc"] = list(msg.bcc)
        if getattr(msg, "reply_to", None):
            payload["reply_to"] = msg.reply_to[0]

        html_body = None
        for content, mimetype in getattr(msg, "alternatives", []) or []:
            if mimetype == "text/html":
                html_body = content
                break
        if getattr(msg, "content_subtype", "plain") == "html":
            html_body, text_body = msg.body, None
        else:
            text_body = msg.body
        if html_body:
            payload["html"] = html_body
        if text_body:
            payload["text"] = text_body

        attachments = []
        for att in getattr(msg, "attachments", []) or []:
            if isinstance(att, tuple):
                filename, content, mimetype = att
                if isinstance(content, str):
                    content = content.encode("utf-8")
                attachments.append({
                    "content": base64.b64encode(content).decode("ascii"),
                    "filename": filename or "attachment",
                    "type": mimetype or "application/octet-stream",
                    "disposition": "attachment",
                })
        if attachments:
            payload["attachments"] = attachments

        body = json.dumps(payload).encode("utf-8")
        last_err = None
        for attempt in range(1 + RETRIES):
            req = urllib.request.Request(
                url,
                data=body,
                method="POST",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    result = json.loads(resp.read().decode("utf-8"))
                if not result.get("success"):
                    raise RuntimeError(f"Cloudflare email send failed: {result.get('errors')}")
                bounces = (result.get("result") or {}).get("permanent_bounces") or []
                if bounces:
                    raise RuntimeError(f"Cloudflare email permanent bounce: {bounces}")
                return
            except urllib.error.HTTPError as e:
                # Retry only rate limits and server errors; 4xx validation won't heal.
                if e.code in (429,) or e.code >= 500:
                    last_err = e
                    time.sleep(RETRY_SLEEP * (attempt + 1))
                    continue
                detail = e.read().decode("utf-8", "replace")[:500]
                raise RuntimeError(f"Cloudflare email send HTTP {e.code}: {detail}") from e
            except urllib.error.URLError as e:
                last_err = e
                time.sleep(RETRY_SLEEP * (attempt + 1))
        raise RuntimeError(f"Cloudflare email send failed after retries: {last_err}")
