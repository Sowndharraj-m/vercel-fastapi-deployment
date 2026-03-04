"""
Onboarding submission schemas.
"""
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class OnboardingSubmitRequest(BaseModel):
    person_id: int
    offer_id: Optional[int] = None
    form_data: dict[str, Any]  # bank details, emergency contact, etc.


class OnboardingSubmissionResponse(BaseModel):
    id: int
    person_id: int
    offer_id: Optional[int] = None
    form_data: Optional[dict] = None
    submitted_at: datetime

    class Config:
        from_attributes = True


class OnboardingStatusResponse(BaseModel):
    person_id: int
    offer_sent: bool = False
    offer_accepted: bool = False
    documents_uploaded: int = 0
    documents_verified: int = 0
    onboarding_submitted: bool = False
