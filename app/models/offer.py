"""
Offer template and offer letter ORM models.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Enum, ForeignKey, JSON,
)
from app.database import Base


class OfferStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    GENERATED = "GENERATED"
    SENT = "SENT"
    VIEWED = "VIEWED"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"


class OfferTemplate(Base):
    __tablename__ = "offer_templates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    content = Column(Text, nullable=False)  # HTML / Markdown with placeholders
    placeholders_schema = Column(JSON, nullable=True)  # list of placeholder keys
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class OfferLetter(Base):
    __tablename__ = "offer_letters"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey("offer_templates.id"), nullable=True)
    rendered_content = Column(Text, nullable=True)
    pdf_file_key = Column(String(500), nullable=True)
    status = Column(Enum(OfferStatus), nullable=False, default=OfferStatus.DRAFT)

    sent_at = Column(DateTime(timezone=True), nullable=True)
    viewed_at = Column(DateTime(timezone=True), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    declined_at = Column(DateTime(timezone=True), nullable=True)

    # Acceptance metadata: IP, user_agent, typed_name, confirmation flags
    acceptance_metadata = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
