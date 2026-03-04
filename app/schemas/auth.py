"""
Authentication request/response schemas.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email")
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class InviteCompleteRequest(BaseModel):
    email: str = Field(..., description="Email from invite")
    password: str = Field(..., min_length=8, description="New password")
    full_name: Optional[str] = None


class AdminCreateUserRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    role: str = Field(default="ADMIN", description="ADMIN | HR | EMPLOYEE")


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
