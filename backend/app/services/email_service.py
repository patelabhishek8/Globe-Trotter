import os
import smtplib
import logging
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Load .env from project root (works locally; in Docker, env vars are injected via docker-compose)
env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

def get_smtp_config():
    # Reload in case .env was modified (only if file exists; in Docker, env vars come from compose)
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    return {
        "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER", "").strip(),
        "password": os.getenv("SMTP_PASSWORD", "").strip(),
        "from_email": os.getenv("SMTP_FROM", "").strip() or os.getenv("SMTP_USER", "").strip() or "support@globetrotter.local",
    }


def send_password_reset_email(to_email: str, verification_code: str) -> tuple[bool, str]:
    """
    Sends a real password reset email containing the 6-digit verification code.
    Attempts delivery through configured SMTP (e.g. Gmail, Outlook, Brevo, SendGrid).
    Returns (success: bool, status_message: str).
    """
    smtp_cfg = get_smtp_config()
    
    subject = "GlobeTrotter — Password Reset Verification Code"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset Your GlobeTrotter Password</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F7F9FC; color: #172033; padding: 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #E4E7EC; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
            .logo {{ color: #1769AA; font-size: 20px; font-weight: bold; margin-bottom: 20px; text-align: center; }}
            .code-box {{ background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }}
            .code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1769AA; }}
            .footer {{ font-size: 11px; color: #667085; text-align: center; margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">GlobeTrotter Smart Travel</div>
            <h2 style="font-size: 18px; margin-top: 0; color: #172033;">Password Reset Verification</h2>
            <p style="font-size: 13px; color: #475467; line-height: 1.6;">
                We received a request to reset your password for your GlobeTrotter account (<strong>{to_email}</strong>). Use the verification code below to verify your identity and set a new password:
            </p>
            <div class="code-box">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #1769AA; margin-bottom: 6px;">Your 6-Digit Verification Code</div>
                <div class="code">{verification_code}</div>
            </div>
            <p style="font-size: 12px; color: #667085; line-height: 1.5;">
                This code is valid for 15 minutes. If you did not request this password reset, please ignore this email.
            </p>
            <div class="footer">
                &copy; 2026 GlobeTrotter Travel Planning Platform.
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"Your GlobeTrotter password reset verification code is: {verification_code}\nValid for 15 minutes."

    # If SMTP credentials are configured, send live email
    if smtp_cfg["user"] and smtp_cfg["password"]:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_cfg["from_email"]
            msg["To"] = to_email
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(smtp_cfg["host"], smtp_cfg["port"], timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_cfg["user"], smtp_cfg["password"])
                server.sendmail(smtp_cfg["from_email"], [to_email], msg.as_string())

            logger.info(f"Password reset email sent via SMTP to {to_email}")
            print(f"\n[SMTP SUCCESS] Password reset email delivered to {to_email}")
            return True, f"Verification code successfully sent to {to_email} via SMTP."
        except Exception as e:
            error_msg = str(e)
            logger.error(f"SMTP sending failed to {to_email}: {error_msg}")
            print(f"\n[SMTP ERROR] Failed to send email to {to_email}: {error_msg}")
            print(f"[VERIFICATION CODE]: {verification_code}")
            return False, f"SMTP Error: {error_msg}. (Check SMTP credentials in .env)"

    # If SMTP is not yet configured with user/password:
    print(f"\n========================================================")
    print(f"[EMAIL SERVICE]: SMTP credentials not set in .env")
    print(f"[EMAIL RECIPIENT]: {to_email}")
    print(f"[VERIFICATION CODE]: {verification_code}")
    print(f"[ACTION]: To deliver live emails to real inboxes, set SMTP_USER and SMTP_PASSWORD in .env")
    print(f"========================================================\n")
    return True, f"Verification code generated for {to_email}. (To receive live inbox emails, configure SMTP_USER & SMTP_PASSWORD in .env)"
