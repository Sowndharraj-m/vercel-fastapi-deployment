"""
Authentication router – login, invite-complete, refresh, password reset.
"""
import secrets
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest, TokenResponse, RefreshRequest,
    InviteCompleteRequest, AdminCreateUserRequest,
    PasswordResetRequest, PasswordResetConfirm,
)
from app.schemas.user import UserResponse
from app.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.dependencies import get_current_user, require_role
from app.email import send_password_reset_email

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register-admin", response_model=UserResponse, status_code=201)
def register_admin(data: AdminCreateUserRequest, db: Session = Depends(get_db)):
    """
    Bootstrap endpoint: create the first admin user.
    In production, disable after initial setup.
    """
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = UserRole(data.role) if data.role in [r.value for r in UserRole] else UserRole.ADMIN
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email + password, receive JWT pair."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    access = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access + refresh pair."""
    payload = decode_token(data.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/register-invite-complete", response_model=UserResponse)
def complete_invite(data: InviteCompleteRequest, db: Session = Depends(get_db)):
    """Invited user sets their password for the first time."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No invite found for this email")
    if user.password_hash:
        raise HTTPException(status_code=400, detail="Account already activated")

    user.password_hash = hash_password(data.password)
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


@router.post("/forgot-password")
def forgot_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Generate a password reset token and send email."""
    user = db.query(User).filter(User.email == data.email).first()

    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If the email exists, a password reset link has been sent."}

    # Generate a secure token
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    # Send email (in dev mode, this logs to console)
    send_password_reset_email(user.email, token)

    return {"message": "If the email exists, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Validate the reset token and update the password."""
    user = db.query(User).filter(User.reset_token == data.token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if user.reset_token_expires and user.reset_token_expires < datetime.now(timezone.utc):
        # Token expired — clear it
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    # Update password
    user.password_hash = hash_password(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password reset successful. You can now log in with your new password."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
