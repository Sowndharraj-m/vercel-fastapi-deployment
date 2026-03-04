"""
Onboarding submission router.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.person import Person
from app.models.onboarding import OnboardingSubmission
from app.models.offer import OfferLetter, OfferStatus
from app.models.document import Document, DocStatus
from app.schemas.onboarding import (
    OnboardingSubmitRequest, OnboardingSubmissionResponse, OnboardingStatusResponse,
)
from app.audit import record_audit

router = APIRouter(prefix="/api/v1/onboarding", tags=["Onboarding"])


@router.post("/submit", response_model=OnboardingSubmissionResponse, status_code=201)
def submit_onboarding(
    data: OnboardingSubmitRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit onboarding form (bank details, emergency contact, confirmations)."""
    person = db.query(Person).filter(Person.id == data.person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    # Only the person themselves or admin can submit
    is_own = person.user_id == current_user.id
    is_admin = current_user.role.value in ("ADMIN", "HR")
    if not is_own and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    submission = OnboardingSubmission(
        person_id=data.person_id,
        offer_id=data.offer_id,
        form_data=data.form_data,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    record_audit(db, current_user.id, "OnboardingSubmission", submission.id, "SUBMIT", request=request)
    return submission


@router.get("/status/{person_id}", response_model=OnboardingStatusResponse)
def onboarding_status(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin: view onboarding progress for a person."""
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    # Check offer status
    offers = db.query(OfferLetter).filter(OfferLetter.person_id == person_id).all()
    offer_sent = any(o.status.value in ("SENT", "VIEWED", "ACCEPTED") for o in offers)
    offer_accepted = any(o.status == OfferStatus.ACCEPTED for o in offers)

    # Check documents
    docs = db.query(Document).filter(Document.person_id == person_id).all()
    docs_uploaded = len(docs)
    docs_verified = sum(1 for d in docs if d.status == DocStatus.VERIFIED)

    # Check onboarding submission
    sub = db.query(OnboardingSubmission).filter(OnboardingSubmission.person_id == person_id).first()

    return OnboardingStatusResponse(
        person_id=person_id,
        offer_sent=offer_sent,
        offer_accepted=offer_accepted,
        documents_uploaded=docs_uploaded,
        documents_verified=docs_verified,
        onboarding_submitted=sub is not None,
    )
