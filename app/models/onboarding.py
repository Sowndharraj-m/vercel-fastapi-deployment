"""
Onboarding submission ORM model.
"""
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, DateTime, ForeignKey, JSON
from app.database import Base


class OnboardingSubmission(Base):
    __tablename__ = "onboarding_submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False, index=True)
    offer_id = Column(Integer, ForeignKey("offer_letters.id"), nullable=True)
    form_data = Column(JSON, nullable=True)  # bank details, emergency contact, confirmations
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
