"""
Document metadata ORM model.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, DateTime, Enum, ForeignKey, BigInteger, Text,
)
from app.database import Base


class DocType(str, enum.Enum):
    AADHAAR = "AADHAAR"
    PAN = "PAN"
    COLLEGE_ID = "COLLEGE_ID"
    PHOTO = "PHOTO"
    RESUME = "RESUME"
    ADDRESS_PROOF = "ADDRESS_PROOF"


class DocStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False, index=True)
    doc_type = Column(Enum(DocType), nullable=False)
    file_key = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=True)
    mime_type = Column(String(100), nullable=True)
    size_bytes = Column(BigInteger, nullable=True)
    file_hash = Column(String(128), nullable=True)
    status = Column(Enum(DocStatus), nullable=False, default=DocStatus.UPLOADED)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    rejection_notes = Column(Text, nullable=True)
