"""
Offer template and offer letter router.
"""
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.person import Person
from app.models.offer import OfferTemplate, OfferLetter, OfferStatus
from app.schemas.offer import (
    OfferTemplateCreate, OfferTemplateResponse,
    OfferLetterGenerate, OfferLetterResponse,
    OfferAcceptRequest, OfferDeclineRequest,
)
from app.audit import record_audit

router = APIRouter(prefix="/api/v1/offers", tags=["Offer Letters"])


# ── Templates ────────────────────────────────────────────────────

@router.post("/templates", response_model=OfferTemplateResponse, status_code=201)
def create_template(
    data: OfferTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Create a new offer letter template."""
    # auto-detect placeholders from {{...}} patterns
    detected = re.findall(r"\{\{(\w+)\}\}", data.content)
    placeholders = data.placeholders_schema or detected

    tmpl = OfferTemplate(
        name=data.name,
        content=data.content,
        placeholders_schema=placeholders,
        created_by=current_user.id,
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return tmpl


@router.get("/templates", response_model=list[OfferTemplateResponse])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """List all offer letter templates."""
    return db.query(OfferTemplate).order_by(OfferTemplate.id.desc()).all()


# ── Offer Letter lifecycle ───────────────────────────────────────

@router.post("", response_model=OfferLetterResponse, status_code=201)
def generate_offer(
    data: OfferLetterGenerate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Generate an offer letter from template for a person."""
    person = db.query(Person).filter(Person.id == data.person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    template = db.query(OfferTemplate).filter(OfferTemplate.id == data.template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Render: replace {{KEY}} with placeholder values
    rendered = template.content
    replacements = data.placeholders or {}
    # Always add person fields as defaults
    replacements.setdefault("FULL_NAME", person.full_name)
    replacements.setdefault("PERSON_CODE", person.person_code)
    if person.email:
        replacements.setdefault("EMAIL", person.email)

    for key, val in replacements.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(val))

    offer = OfferLetter(
        person_id=person.id,
        template_id=template.id,
        rendered_content=rendered,
        status=OfferStatus.GENERATED,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    record_audit(db, current_user.id, "OfferLetter", offer.id, "GENERATE",
                 after={"person_id": person.id, "status": "GENERATED"}, request=request)
    return offer


@router.post("/{offer_id}/send", response_model=OfferLetterResponse)
def send_offer(
    offer_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Mark offer as sent (email sending is a stub for MVP)."""
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.status not in (OfferStatus.GENERATED, OfferStatus.DRAFT):
        raise HTTPException(status_code=400, detail=f"Cannot send offer in status: {offer.status.value}")

    offer.status = OfferStatus.SENT
    offer.sent_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(offer)

    record_audit(db, current_user.id, "OfferLetter", offer.id, "SEND", request=request)
    return offer


@router.get("/{offer_id}", response_model=OfferLetterResponse)
def get_offer(
    offer_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """View an offer letter. Marks as VIEWED if first time for the person."""
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    # Self-service: only the person or admin can view
    person = db.query(Person).filter(Person.id == offer.person_id).first()
    is_own = person and person.user_id == current_user.id
    is_admin = current_user.role.value in ("ADMIN", "HR")
    if not is_own and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark as viewed on first access by the person
    if is_own and offer.status == OfferStatus.SENT:
        offer.status = OfferStatus.VIEWED
        offer.viewed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(offer)

    return offer


@router.post("/{offer_id}/accept", response_model=OfferLetterResponse)
def accept_offer(
    offer_id: int,
    data: OfferAcceptRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Person accepts the offer letter."""
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    person = db.query(Person).filter(Person.id == offer.person_id).first()
    if not person or person.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only accept your own offer")

    if offer.status not in (OfferStatus.SENT, OfferStatus.VIEWED):
        raise HTTPException(status_code=400, detail=f"Cannot accept offer in status: {offer.status.value}")

    offer.status = OfferStatus.ACCEPTED
    offer.accepted_at = datetime.now(timezone.utc)
    offer.acceptance_metadata = {
        "typed_name": data.typed_name,
        "confirmation": data.confirmation,
        "start_date_confirmed": data.start_date_confirmed,
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    db.commit()
    db.refresh(offer)

    record_audit(db, current_user.id, "OfferLetter", offer.id, "ACCEPT",
                 after=offer.acceptance_metadata, request=request)
    return offer


@router.post("/{offer_id}/decline", response_model=OfferLetterResponse)
def decline_offer(
    offer_id: int,
    data: OfferDeclineRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Person declines the offer letter."""
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    person = db.query(Person).filter(Person.id == offer.person_id).first()
    if not person or person.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only decline your own offer")

    if offer.status not in (OfferStatus.SENT, OfferStatus.VIEWED):
        raise HTTPException(status_code=400, detail=f"Cannot decline offer in status: {offer.status.value}")

    offer.status = OfferStatus.DECLINED
    offer.declined_at = datetime.now(timezone.utc)
    offer.acceptance_metadata = {"reason": data.reason}
    db.commit()
    db.refresh(offer)

    record_audit(db, current_user.id, "OfferLetter", offer.id, "DECLINE", request=request)
    return offer


@router.get("/me/offers", response_model=list[OfferLetterResponse],
            name="my_offers")
def get_my_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self-service: list all offers for the current user's person record."""
    person = db.query(Person).filter(Person.user_id == current_user.id).first()
    if not person:
        return []
    return db.query(OfferLetter).filter(OfferLetter.person_id == person.id).order_by(OfferLetter.id.desc()).all()
