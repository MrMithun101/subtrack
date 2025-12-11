import os
import smtplib
import logging
from email.message import EmailMessage
from typing import Optional

logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    body: str,
    *,
    from_email: Optional[str] = None,
) -> None:
    """
    Send an email using SMTP.
    
    Reads SMTP configuration from environment variables:
      - SMTP_HOST
      - SMTP_PORT
      - SMTP_USERNAME
      - SMTP_PASSWORD
      - EMAIL_FROM (default from_email)
    
    In dev mode, if SMTP is not configured, just log/print the email instead of failing.
    """
    # Get SMTP configuration from environment
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = from_email or os.getenv("EMAIL_FROM", "noreply@subtrack.app")
    
    # If SMTP is not configured, just log/print the email (dev mode)
    if not smtp_host or not smtp_username or not smtp_password:
        logger.warning(
            "SMTP not configured. Email will be printed to console instead of sent.\n"
            "Set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD environment variables to enable email sending."
        )
        print("=" * 60)
        print("EMAIL (NOT SENT - SMTP not configured)")
        print("=" * 60)
        print(f"From: {email_from}")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print("-" * 60)
        print(body)
        print("=" * 60)
        return
    
    # Create email message
    msg = EmailMessage()
    msg["From"] = email_from
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    
    # Send email via SMTP
    try:
        smtp_port_int = int(smtp_port)
        with smtplib.SMTP(smtp_host, smtp_port_int) as server:
            # Use TLS if port is 587
            if smtp_port_int == 587:
                server.starttls()
            # Login if credentials are provided
            if smtp_username and smtp_password:
                server.login(smtp_username, smtp_password)
            # Send the email
            server.send_message(msg)
            logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        # In dev mode, don't crash - just log the error
        print(f"ERROR: Failed to send email: {str(e)}")
        print("Email content:")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
