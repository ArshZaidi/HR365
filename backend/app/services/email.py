from __future__ import annotations

import os
import smtplib
import ssl
from email.message import EmailMessage


def send_hr_email(
    *,
    subject: str,
    body: str,
    reply_to: str | None = None,
) -> None:
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")
    from_email = os.getenv("SMTP_FROM_EMAIL", "").strip()
    hr_email = os.getenv("HR_NOTIFICATION_EMAIL", "").strip()

    if not all(
        [
            host,
            username,
            password,
            from_email,
            hr_email,
        ]
    ):
        raise RuntimeError(
            "HR email notification is not configured."
        )

    message = EmailMessage()

    message["Subject"] = subject
    message["From"] = from_email
    message["To"] = hr_email

    if reply_to:
        message["Reply-To"] = reply_to

    message.set_content(body)

    context = ssl.create_default_context()

    with smtplib.SMTP(
        host,
        port,
        timeout=20,
    ) as server:
        server.ehlo()
        server.starttls(context=context)
        server.ehlo()
        server.login(username, password)
        server.send_message(message)