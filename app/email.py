"""
Email utility – sends emails via SMTP or logs to console in development.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import get_settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html_body: str) -> bool:
    """Send an email. Returns True if sent successfully."""
    settings = get_settings()

    if not settings.SMTP_HOST:
        # Development mode – log to console
        logger.info(f"\n{'='*60}")
        logger.info(f"📧 EMAIL (dev mode – not actually sent)")
        logger.info(f"   To:      {to}")
        logger.info(f"   Subject: {subject}")
        logger.info(f"   Body:    {html_body[:200]}...")
        logger.info(f"{'='*60}\n")
        print(f"\n{'='*60}")
        print(f"📧 EMAIL (dev mode – not actually sent)")
        print(f"   To:      {to}")
        print(f"   Subject: {subject}")
        print(f"   Body:    {html_body[:300]}...")
        print(f"{'='*60}\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.MAIL_FROM
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to, msg.as_string())

        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


def send_password_reset_email(to: str, reset_token: str) -> bool:
    """Send a password reset email with the reset link."""
    settings = get_settings()
    reset_url = f"{settings.FRONTEND_URL}/forgot-password?token={reset_token}"

    html = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #6366f1;">🔐 Password Reset</h2>
        <p>You requested a password reset for your StartupHR account.</p>
        <p>Click the button below to set a new password:</p>
        <a href="{reset_url}"
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Reset Password
        </a>
        <p style="color: #888; font-size: 13px;">This link expires in 1 hour.</p>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 11px;">StartupHR – Employee & Intern Management System</p>
    </div>
    """
    return send_email(to, "Password Reset – StartupHR", html)


def send_offer_notification_email(to: str, person_name: str) -> bool:
    """Notify a person that an offer letter has been generated."""
    settings = get_settings()
    offer_url = f"{settings.FRONTEND_URL}/login"

    html = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #6366f1;">📄 Offer Letter Ready</h2>
        <p>Dear {person_name},</p>
        <p>Your offer letter has been generated and is ready for review.</p>
        <a href="{offer_url}"
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            View Offer Letter
        </a>
        <p style="color: #888; font-size: 13px;">Please review and accept or decline the offer.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 11px;">StartupHR – Employee & Intern Management System</p>
    </div>
    """
    return send_email(to, "Offer Letter Ready – StartupHR", html)
