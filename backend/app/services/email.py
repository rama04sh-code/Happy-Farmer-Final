from email.message import EmailMessage
import smtplib
import ssl

from app.core.config import settings


def send_password_reset_email(recipient: str, token: str) -> bool:
    """Send a reset token only when SMTP is configured; never log the secret token."""
    if not all((settings.smtp_host, settings.smtp_from_email)):
        return False
    msg = EmailMessage()
    msg["Subject"] = "إعادة تعيين كلمة مرور Happy Farmer"
    msg["From"] = settings.smtp_from_email
    msg["To"] = recipient
    msg.set_content(
        "تم طلب إعادة تعيين كلمة المرور لحسابك في Happy Farmer.\n\n"
        f"رمز إعادة التعيين: {token}\n\n"
        "الرمز صالح لمدة 30 دقيقة ويستخدم مرة واحدة. إذا لم تطلب ذلك فتجاهل الرسالة."
    )
    context = ssl.create_default_context()
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_starttls:
            server.starttls(context=context)
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password or "")
        server.send_message(msg)
    return True
