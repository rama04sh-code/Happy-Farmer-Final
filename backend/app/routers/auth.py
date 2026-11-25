from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (create_access_token, hash_password, hash_reset_token,
                               new_reset_token, verify_password)
from app.db import get_db
from app.deps import get_current_user
from app.models import LoginAttempt, PasswordResetToken, User, utcnow
from app.schemas import (PasswordChange, PasswordResetConfirm, PasswordResetRequest,
                         Token, UserCreate, UserOut)
from app.services.email import send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _email_fingerprint(email: str) -> str:
    return hmac.new(settings.secret_key.encode("utf-8"), email.strip().lower().encode("utf-8"), hashlib.sha256).hexdigest()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "البريد الإلكتروني مسجّل مسبقاً")
    user = User(name=data.name, email=email, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = form.username.strip().lower()
    fingerprint = _email_fingerprint(email)
    ip = _client_ip(request)
    now = utcnow()
    # Bound the audit table without affecting the active rate-limit window.
    db.execute(delete(LoginAttempt).where(LoginAttempt.attempted_at < now - timedelta(days=30)))
    cutoff = now - timedelta(minutes=settings.login_window_minutes)
    email_failures = db.scalar(select(func.count(LoginAttempt.id)).where(
        LoginAttempt.attempted_at >= cutoff, LoginAttempt.email_hash == fingerprint)) or 0
    ip_failures = 0
    if ip:
        ip_failures = db.scalar(select(func.count(LoginAttempt.id)).where(
            LoginAttempt.attempted_at >= cutoff, LoginAttempt.ip_address == ip)) or 0
    if email_failures >= settings.login_max_attempts or ip_failures >= settings.login_ip_max_attempts:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                            "محاولات دخول كثيرة. حاول مرة أخرى بعد انتهاء فترة الحماية.",
                            headers={"Retry-After": str(settings.login_window_minutes * 60)})

    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(form.password, user.password_hash):
        db.add(LoginAttempt(email_hash=fingerprint, ip_address=ip))
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "البريد أو كلمة المرور غير صحيحة")

    # Remove the failed attempts tied to this account after successful authentication.
    db.execute(delete(LoginAttempt).where(LoginAttempt.email_hash == fingerprint))
    db.commit()
    return Token(access_token=create_access_token(user.id, user.token_version))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/password")
def change_password(data: PasswordChange, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "كلمة المرور الحالية غير صحيحة")
    if data.current_password == data.new_password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "اختر كلمة مرور جديدة مختلفة")
    user.password_hash = hash_password(data.new_password)
    user.token_version += 1  # invalidate all previously issued sessions
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    db.commit()
    return {"message": "تم تغيير كلمة المرور. سجّل الدخول مجدداً."}


@router.post("/password-reset/request")
def request_password_reset(data: PasswordResetRequest, db: Session = Depends(get_db)):
    # Same response for known and unknown addresses to prevent account enumeration.
    generic = {"message": "إذا كان البريد مسجلاً، فستصلك تعليمات إعادة التعيين."}
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if not user:
        return generic

    now = utcnow()
    # Only the most recently requested reset token remains valid.
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    raw_token = new_reset_token()
    token_hash = hash_reset_token(raw_token)
    db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash,
                              expires_at=now + timedelta(minutes=30)))
    db.commit()
    try:
        sent = send_password_reset_email(user.email, raw_token)
    except Exception:
        logger.exception("Password reset email delivery failed")
        sent = False
    if not sent:
        db.execute(delete(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash))
        db.commit()
        logger.warning("Password reset requested but SMTP is not configured or delivery failed")
    return generic


@router.post("/password-reset/confirm")
def confirm_password_reset(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    token_row = db.scalar(select(PasswordResetToken).where(
        PasswordResetToken.token_hash == hash_reset_token(data.token),
        PasswordResetToken.used_at.is_(None)))
    now = utcnow()
    expires_at = token_row.expires_at if token_row else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not token_row or expires_at < now:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "رمز إعادة التعيين غير صالح أو منتهي الصلاحية")
    user = db.get(User, token_row.user_id)
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "رمز إعادة التعيين غير صالح أو منتهي الصلاحية")
    user.password_hash = hash_password(data.new_password)
    user.token_version += 1
    token_row.used_at = now
    db.execute(delete(PasswordResetToken).where(
        PasswordResetToken.user_id == user.id, PasswordResetToken.id != token_row.id))
    db.commit()
    return {"message": "تمت إعادة تعيين كلمة المرور. يمكنك تسجيل الدخول الآن."}
