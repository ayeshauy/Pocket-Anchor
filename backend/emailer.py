"""Emergent managed email (Resend via integration proxy).
Recipients come from server-side records; bodies from these fixed templates only (G4).
"""
import os
import re
import ipaddress
import logging
import httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from fastapi import HTTPException

logger = logging.getLogger("anchor.email")

EMAIL_BASE_URL = "https://integrations.emergentagent.com"  # constant on purpose


def _cfg():
    """Read email env lazily — module may be imported before load_dotenv runs."""
    return (os.environ["EMERGENT_EMAIL_KEY"], os.environ["EMAIL_FROM_NAME"], os.environ.get("EMAIL_REPLY_TO"))

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> str | None:
    _assert_safe_email(subject, html)
    key, from_name, reply_to = _cfg()
    payload = {"to": [to], "subject": subject, "html": html, "from_name": from_name}
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": key},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        raise HTTPException(status_code=502, detail="Failed to send email")
    except Exception as e:
        logger.error(f"Email send error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email")


# ---------- Templates (server-side only) ----------

def _shell(inner: str) -> str:
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        'style="background:#FBFBF9;padding:32px 12px">'
        '<tr><td align="center">'
        '<table role="presentation" width="560" cellpadding="0" cellspacing="0" '
        'style="background:#FFFFFF;border-radius:24px;border:1px solid #ECEAE2;padding:36px">'
        '<tr><td style="font-family:Georgia,serif;color:#1F2623">'
        f"{inner}"
        f'<p style="font-size:11px;color:#7E8B83;margin-top:32px;font-family:Arial,sans-serif">'
        f'Sent softly by {escape(_cfg()[1])}. No reply is ever needed here.</p>'
        "</td></tr></table></td></tr></table>"
    )


def guardian_invite_html(owner_name: str, sanctuary_name: str, accept_url: str, circle_url: str) -> tuple[str, str]:
    subject = f"{sanctuary_name} has made you a quiet guardian"
    inner = (
        f'<p style="font-size:26px;margin:0 0 12px">{escape(sanctuary_name)} asked you to watch softly.</p>'
        f'<p style="font-family:Arial,sans-serif;font-size:14px;color:#535E56;line-height:1.7">'
        f'Hi there, {escape(sanctuary_name)} has named you a guardian of their Pocket Anchor sanctuary. '
        f"That means nothing loud — no metrics, no read receipts. You'll simply know when the day lands heavy, "
        f"and you can send a Thinking-of-You pulse that needs no reply.</p>"
        f'<p style="margin:28px 0"><a href="{accept_url}" style="background:#4C5D4B;color:#FBFBF9;'
        f'padding:14px 28px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px">'
        f"Accept your guardian place</a></p>"
        f'<p style="font-family:Arial,sans-serif;font-size:12px;color:#7E8B83">Once accepted, your soft circle lives here: '
        f'<a href="{circle_url}" style="color:#C1521E">your circle page</a>.</p>'
    )
    return subject, _shell(inner)


def contact_ping_html(contact_name: str, owner_name: str, kind: str, note: str) -> tuple[str, str]:
    labels = {
        "safe": ("I'm safe", "#4C5D4B", "sent an I'm-safe check-in"),
        "location": ("Location shared", "#9197AA", "shared their location with you"),
        "help": ("I need help", "#C1521E", "asked for help — please reach out"),
        "emergency": ("Emergency", "#C1521E", "triggered an emergency ping — please contact them now"),
        "know": ("I need someone to know", "#9197AA", "wanted you to know something — no action needed"),
    }
    label, color, action = labels.get(kind, labels["help"])
    subject = f"{owner_name}: {label}"
    note_html = f'<p style="font-family:Georgia,serif;font-size:18px;color:#1F2623;font-style:italic;margin:16px 0">"{escape(note)}"</p>' if note else ""
    inner = (
        f'<p style="font-size:26px;margin:0 0 12px;color:{color}">{escape(label)}</p>'
        f'<p style="font-family:Arial,sans-serif;font-size:14px;color:#535E56;line-height:1.7">'
        f"Hi {escape(contact_name)}, {escape(owner_name)} {escape(action)} through Pocket Anchor.</p>"
        f"{note_html}"
    )
    return subject, _shell(inner)


def pulse_notify_html(guardian_name: str, owner_name: str, note: str, circle_url: str) -> tuple[str, str]:
    subject = f"{owner_name} sent you a soft pulse"
    note_html = f'<p style="font-family:Georgia,serif;font-size:18px;color:#1F2623;font-style:italic;margin:16px 0">"{escape(note)}"</p>' if note else ""
    inner = (
        f'<p style="font-size:26px;margin:0 0 12px">A soft pulse, just for you.</p>'
        f'<p style="font-family:Arial,sans-serif;font-size:14px;color:#535E56;line-height:1.7">'
        f"Hi {escape(guardian_name)}, {escape(owner_name)} sent you a Thinking-of-You pulse — "
        f"a small vibration that says: you crossed my mind, and I'm glad you exist.</p>"
        f"{note_html}"
        f'<p style="margin:24px 0"><a href="{circle_url}" style="background:#4C5D4B;color:#FBFBF9;'
        f'padding:14px 28px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px">'
        f"Open your circle</a></p>"
    )
    return subject, _shell(inner)


def owner_pulse_html(owner_name: str, guardian_name: str, note: str) -> tuple[str, str]:
    subject = f"{guardian_name} sent you a soft pulse"
    note_html = f'<p style="font-family:Georgia,serif;font-size:18px;color:#1F2623;font-style:italic;margin:16px 0">"{escape(note)}"</p>' if note else ""
    inner = (
        f'<p style="font-size:26px;margin:0 0 12px">Someone is thinking of you.</p>'
        f'<p style="font-family:Arial,sans-serif;font-size:14px;color:#535E56;line-height:1.7">'
        f"{escape(guardian_name)} just sent you a Thinking-of-You pulse. Nothing to answer. "
        f"Just warmth, held.</p>"
        f"{note_html}"
    )
    return subject, _shell(inner)


def weekly_summary_html(owner_name: str, guardian_name: str, reasons_count: int, mood_state: str | None,
                        circle_url: str) -> tuple[str, str]:
    mood_line = {
        "grounded": "This week landed grounded — Willow Grove tones, steady and held.",
        "hopeful": "This week carried hope — Mimosa light, reaching outward.",
        "struggling": "This week landed heavy — Azul skies. A gentle word from you would mean a lot.",
        None: "No mood pulse was logged this week — silence can be its own weather.",
    }.get(mood_state, "A quiet week, unmeasured.")
    subject = f"A soft week in {owner_name}'s sanctuary"
    inner = (
        f'<p style="font-size:26px;margin:0 0 12px">A quiet week, held.</p>'
        f'<p style="font-family:Arial,sans-serif;font-size:14px;color:#535E56;line-height:1.7">'
        f"Hi {escape(guardian_name)}, here is the softest possible summary of {escape(owner_name)}'s week — "
        f"no metrics to chase, only weather to notice:</p>"
        f'<table role="presentation" width="100%" style="background:#FEF3DE;border-radius:16px;margin:20px 0">'
        f'<tr><td style="padding:20px;font-family:Arial,sans-serif;font-size:14px;color:#1F2623;line-height:1.8">'
        f"{escape(mood_line)}<br/>"
        f"<strong>{reasons_count}</strong> reason{'s' if reasons_count != 1 else ''} to stay arrived this week."
        f"</td></tr></table>"
        f'<p style="margin:24px 0"><a href="{circle_url}" style="background:#F7B557;color:#1F2623;'
        f'padding:14px 28px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px">'
        f"Open your circle</a></p>"
        f'<p style="font-family:Arial,sans-serif;font-size:12px;color:#7E8B83">'
        f"A Thinking-of-You pulse arrives as a soft vibration — nothing to answer.</p>"
    )
    return subject, _shell(inner)
