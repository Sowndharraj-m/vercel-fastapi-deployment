"""
Offer template and offer letter schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


# ── Templates ────────────────────────────────────────────────────

class OfferTemplateCreate(BaseModel):
    name: str = Field(..., max_length=255)
    content: str = Field(..., description="HTML/Markdown with {{PLACEHOLDER}} vars")
    placeholders_schema: Optional[list[str]] = None


class OfferTemplateResponse(BaseModel):
    id: int
    name: str
    version: int
    content: str
    placeholders_schema: Optional[list[str]] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Offer Letters ────────────────────────────────────────────────

class OfferLetterGenerate(BaseModel):
    person_id: int
    template_id: int
    placeholders: Optional[dict[str, Any]] = None  # values for template placeholders


class OfferLetterResponse(BaseModel):
    id: int
    person_id: int
    template_id: Optional[int] = None
    rendered_content: Optional[str] = None
    pdf_file_key: Optional[str] = None
    status: str
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    declined_at: Optional[datetime] = None
    acceptance_metadata: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OfferAcceptRequest(BaseModel):
    typed_name: Optional[str] = None
    confirmation: bool = True
    start_date_confirmed: Optional[str] = None


class OfferDeclineRequest(BaseModel):
    reason: Optional[str] = None
