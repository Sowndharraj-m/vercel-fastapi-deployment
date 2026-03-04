"""
Document request/response schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DocumentUploadResponse(BaseModel):
    id: int
    person_id: int
    doc_type: str
    original_filename: Optional[str] = None
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    id: int
    person_id: int
    doc_type: str
    original_filename: Optional[str] = None
    status: str
    uploaded_at: datetime
    verified_at: Optional[datetime] = None
    rejection_notes: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentVerifyRequest(BaseModel):
    notes: Optional[str] = None


class DocumentRejectRequest(BaseModel):
    notes: str = Field(..., min_length=1, description="Reason for rejection")


class DocumentDownloadResponse(BaseModel):
    download_url: str
    expires_in_seconds: int = 3600
