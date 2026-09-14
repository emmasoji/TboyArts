import os
from typing import Any

import resend

from utils.supabase import insert, select, update
from services.storage_service import get_welcome_newsletter_markdown


RESEND_API_KEY = os.getenv("RESEND_API_KEY")
NEWSLETTER_FROM_EMAIL = os.getenv(
    "NEWSLETTER_FROM_EMAIL",
    "TboyArts <onboarding@resend.dev>",
)


class NewsletterError(RuntimeError):
    pass


def _configure_resend() -> None:
    if not RESEND_API_KEY:
        raise NewsletterError(
            "RESEND_API_KEY is not configured on the backend."
        )

    resend.api_key = RESEND_API_KEY


async def get_active_subscribers() -> list[dict[str, Any]]:
    return await select(
        "newsletter_subscribers",
        columns="id,email",
        filters={"active": True},
    )


async def get_welcome_newsletter() -> dict[str, Any]:
    rows = await select(
        "home_settings",
        columns=(
            "id,"
            "newsletter_email_subject,"
            "newsletter_email_heading,"
            "newsletter_email_body,"
            "newsletter_email_button_text,"
            "newsletter_email_button_url"
        ),
    )

    if not rows:
        raise NewsletterError(
            "Welcome newsletter settings have not been configured."
        )

    settings = rows[0]

    # The uploaded Markdown file is the preferred body source.
    # If no Markdown file exists, fall back to the existing
    # newsletter_email_body field so the current system keeps working.
    markdown_message = ""

    try:
        markdown_message = (
            get_welcome_newsletter_markdown()
            or ""
        ).strip()
    except Exception as exc:
        print(
            "[NEWSLETTER] Could not load uploaded Markdown "
            f"source: {exc}"
        )

    message = (
        markdown_message
        if markdown_message
        else settings.get("newsletter_email_body") or ""
    )

    return {
        "subject": settings.get("newsletter_email_subject") or "",
        "heading": settings.get("newsletter_email_heading") or "Welcome to TboyArts",
        "message": message,
        "buttonText": settings.get("newsletter_email_button_text") or "",
        "buttonUrl": settings.get("newsletter_email_button_url") or "",
        "markdownSource": bool(markdown_message),
    }


def _inline_markdown(value: str) -> str:
    import html
    import re

    value = html.escape(value, quote=True)

    # Markdown images: ![alt](https://example.com/image.jpg)
    value = re.sub(
        r"!\[([^\]]*)\]\((https?://[^\s\)]+)\)",
        r'<img src="\2" alt="\1" style="display:block;width:100%;max-width:100%;height:auto;margin:18px auto;border:0;" />',
        value,
    )

    # Markdown links: [text](https://example.com)
    value = re.sub(
        r"\[([^\]]+)\]\((https?://[^\s\)]+)\)",
        r'<a href="\2" style="color:#111;text-decoration:underline;">\1</a>',
        value,
    )

    # Bold: **text**
    value = re.sub(
        r"\*\*([^*]+)\*\*",
        r"<strong>\1</strong>",
        value,
    )

    # Italic: *text*
    value = re.sub(
        r"(?<!\*)\*([^*\n]+)\*(?!\*)",
        r"<em>\1</em>",
        value,
    )

    # Inline code: `text`
    value = re.sub(
        r"`([^`]+)`",
        r'<code style="background:#f1f1f1;padding:2px 5px;border-radius:4px;">\1</code>',
        value,
    )

    return value


def _markdown_to_html(markdown_text: str) -> str:
    import html

    lines = markdown_text.replace("\r\n", "\n").replace("\r", "\n").split("\n")

    output: list[str] = []
    paragraph: list[str] = []
    in_list = False

    def flush_paragraph() -> None:
        nonlocal paragraph

        if not paragraph:
            return

        content = " ".join(
            line.strip()
            for line in paragraph
        )

        output.append(
            f'<p style="margin:0 0 18px;">'
            f'{_inline_markdown(content)}'
            f'</p>'
        )

        paragraph = []

    def close_list() -> None:
        nonlocal in_list

        if in_list:
            output.append("</ul>")
            in_list = False

    for raw_line in lines:
        line = raw_line.strip()

        if not line:
            flush_paragraph()
            close_list()
            continue

        # Headings
        if line.startswith("### "):
            flush_paragraph()
            close_list()

            output.append(
                '<h3 style="margin:24px 0 12px;font-size:20px;">'
                f'{_inline_markdown(line[4:])}'
                "</h3>"
            )
            continue

        if line.startswith("## "):
            flush_paragraph()
            close_list()

            output.append(
                '<h2 style="margin:28px 0 14px;font-size:24px;">'
                f'{_inline_markdown(line[3:])}'
                "</h2>"
            )
            continue

        if line.startswith("# "):
            flush_paragraph()
            close_list()

            output.append(
                '<h2 style="margin:28px 0 14px;font-size:26px;">'
                f'{_inline_markdown(line[2:])}'
                "</h2>"
            )
            continue

        # Unordered lists
        if line.startswith("- ") or line.startswith("* "):
            flush_paragraph()

            if not in_list:
                output.append(
                    '<ul style="margin:0 0 18px;padding-left:24px;">'
                )
                in_list = True

            output.append(
                '<li style="margin:6px 0;">'
                f'{_inline_markdown(line[2:])}'
                "</li>"
            )
            continue

        # Horizontal rule
        if line in {"---", "***", "___"}:
            flush_paragraph()
            close_list()
            output.append(
                '<hr style="border:0;border-top:1px solid #eee;margin:28px 0;">'
            )
            continue

        close_list()
        paragraph.append(line)

    flush_paragraph()
    close_list()

    return "".join(output)


def _welcome_email_html(
    message: str,
    button_text: str,
    button_url: str,
    heading: str = "Welcome to TboyArts",
) -> str:
    import html

    safe_heading = html.escape(
        heading or "Welcome to TboyArts"
    )

    message_html = _markdown_to_html(message)

    button = ""

    if button_text.strip() and button_url.strip():
        safe_text = html.escape(button_text)
        safe_url = html.escape(
            button_url,
            quote=True,
        )

        button = f"""
        <p style="margin:28px 0;">
          <a
            href="{safe_url}"
            style="
              display:inline-block;
              padding:12px 22px;
              background:#111;
              color:#fff;
              text-decoration:none;
              border-radius:6px;
              font-family:Arial,sans-serif;
              font-size:14px;
            "
          >
            {safe_text}
          </a>
        </p>
        """

    return f"""
    <!DOCTYPE html>
    <html>
      <body style="
        margin:0;
        padding:0;
        background:#f5f5f5;
        font-family:Arial,Helvetica,sans-serif;
        color:#111;
      ">
        <div style="
          max-width:600px;
          margin:40px auto;
          background:#fff;
          padding:40px;
        ">
          <h1 style="
            margin:0 0 24px;
            font-size:28px;
            font-weight:600;
          ">
            {safe_heading}
          </h1>

          <div style="
            font-size:16px;
            line-height:1.7;
          ">
            {message_html}
          </div>

          {button}

          <p style="
            margin-top:40px;
            padding-top:20px;
            border-top:1px solid #eee;
            color:#777;
            font-size:12px;
          ">
            You received this email because you subscribed
            to the TboyArts newsletter.
          </p>
        </div>
      </body>
    </html>
    """


async def send_welcome_email(email: str) -> dict[str, Any]:
    _configure_resend()

    newsletter = await get_welcome_newsletter()

    subject = newsletter["subject"].strip()

    if not subject:
        subject = "Welcome to TboyArts"

    html = _welcome_email_html(
        message=newsletter["message"],
        button_text=newsletter["buttonText"],
        button_url=newsletter["buttonUrl"],
        heading=newsletter.get(
            "heading",
            "Welcome to TboyArts",
        ),
    )

    print(f"[NEWSLETTER] Sending welcome email to {email}...")

    try:
        response = resend.Emails.send(
            {
                "from": NEWSLETTER_FROM_EMAIL,
                "to": [email],
                "subject": subject,
                "html": html,
            }
        )

        print(
            f"[NEWSLETTER] Welcome email response for {email}: "
            f"{response}"
        )

        if isinstance(response, dict) and response.get("error"):
            raise NewsletterError(
                str(response["error"])
            )

        return {
            "success": True,
            "email": email,
        }

    except NewsletterError:
        raise

    except Exception as exc:
        print(
            f"[NEWSLETTER] Welcome email failed for {email}: "
            f"{exc}"
        )

        raise NewsletterError(
            f"Failed to send welcome email: {exc}"
        ) from exc


async def subscribe_and_send_welcome(email: str) -> dict[str, Any]:
    normalized_email = email.strip().lower()

    if not normalized_email or len(normalized_email) <= 3:
        raise NewsletterError(
            "Please enter a valid email address."
        )

    try:
        subscribers = await select(
            "newsletter_subscribers",
            columns="id,email,active",
            filters={"email": normalized_email},
        )

        if subscribers:
            existing = subscribers[0]

            if existing.get("active"):
                return {
                    "subscribed": False,
                    "already_subscribed": True,
                    "welcome_sent": False,
                    "message": "This email is already subscribed.",
                }

            updated = await update(
                "newsletter_subscribers",
                {"id": existing["id"]},
                {
                    "active": True,
                },
            )

        else:
            updated = await insert(
                "newsletter_subscribers",
                {
                    "email": normalized_email,
                    "active": True,
                },
            )

    except Exception as exc:
        error_text = str(exc)

        if "duplicate" in error_text.lower():
            return {
                "subscribed": False,
                "already_subscribed": True,
                "welcome_sent": False,
                "message": "This email is already subscribed.",
            }

        raise NewsletterError(
            f"Failed to subscribe email: {exc}"
        ) from exc

    await send_welcome_email(normalized_email)

    return {
        "subscribed": True,
        "already_subscribed": False,
        "welcome_sent": True,
        "message": "Subscription successful.",
    }


async def send_newsletter(
    subject: str,
    html: str,
    from_email: str | None = None,
    from_name: str | None = None,
) -> dict[str, Any]:
    _configure_resend()

    subscribers = await get_active_subscribers()

    print(
        f"[NEWSLETTER] Found {len(subscribers)} active subscriber(s)."
    )

    if not subscribers:
        return {
            "sent": 0,
            "failed": 0,
            "total": 0,
            "message": "There are no active newsletter subscribers.",
        }

    sender = from_email or NEWSLETTER_FROM_EMAIL

    if from_name and "<" not in sender:
        sender = f"{from_name} <{sender}>"

    sent = 0
    failed = 0
    failures: list[dict[str, str]] = []

    for subscriber in subscribers:
        email = str(subscriber.get("email") or "").strip()

        if not email:
            failed += 1
            failures.append(
                {
                    "email": "",
                    "error": "Subscriber has no email address.",
                }
            )
            continue

        print(f"[NEWSLETTER] Sending to {email}...")

        try:
            response = resend.Emails.send(
                {
                    "from": sender,
                    "to": [email],
                    "subject": subject,
                    "html": html,
                }
            )

            print(
                f"[NEWSLETTER] Resend response for {email}: {response}"
            )

            response_error = None

            if isinstance(response, dict):
                response_error = response.get("error")

            if response_error:
                failed += 1
                failures.append(
                    {
                        "email": email,
                        "error": str(response_error),
                    }
                )

                print(
                    f"[NEWSLETTER] FAILED for {email}: "
                    f"{response_error}"
                )

                continue

            sent += 1

        except Exception as exc:
            failed += 1

            failures.append(
                {
                    "email": email,
                    "error": str(exc),
                }
            )

            print(
                f"[NEWSLETTER] EXCEPTION for {email}: {exc}"
            )

    print(
        f"[NEWSLETTER] Complete: "
        f"{sent} sent, {failed} failed, "
        f"{len(subscribers)} total."
    )

    return {
        "sent": sent,
        "failed": failed,
        "total": len(subscribers),
        "failures": failures,
    }
