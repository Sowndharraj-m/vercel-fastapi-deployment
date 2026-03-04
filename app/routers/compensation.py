"""
Compensation, payout, and payslip router.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.person import Person
from app.models.compensation import (
    CompensationProfile, CompType, Payout, PayoutStatus, Payslip,
)
from app.schemas.compensation import (
    CompensationProfileCreate, CompensationProfileResponse,
    PayoutRunRequest, PayoutResponse, PayoutMarkPaidRequest,
    PayslipResponse, PayslipDownloadResponse,
)
from app.audit import record_audit

router = APIRouter(prefix="/api/v1", tags=["Compensation & Payroll"])


# ── Compensation Profile ─────────────────────────────────────────

@router.post("/compensation/{person_id}", response_model=CompensationProfileResponse, status_code=201)
def create_compensation(
    person_id: int,
    data: CompensationProfileCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Admin: set compensation profile for a person."""
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    # Upsert: update if exists
    existing = db.query(CompensationProfile).filter(CompensationProfile.person_id == person_id).first()
    if existing:
        existing.comp_type = CompType(data.comp_type)
        existing.amount = data.amount
        existing.currency = data.currency
        existing.effective_from = data.effective_from
        if data.bank_details:
            existing.bank_details_encrypted = data.bank_details
        db.commit()
        db.refresh(existing)
        record_audit(db, current_user.id, "CompensationProfile", existing.id, "UPDATE", request=request)
        return existing

    profile = CompensationProfile(
        person_id=person_id,
        comp_type=CompType(data.comp_type),
        amount=data.amount,
        currency=data.currency,
        effective_from=data.effective_from,
        bank_details_encrypted=data.bank_details,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    record_audit(db, current_user.id, "CompensationProfile", profile.id, "CREATE", request=request)
    return profile


@router.get("/compensation/{person_id}", response_model=CompensationProfileResponse)
def get_compensation(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """View compensation profile (admin or self)."""
    # Access check
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    is_own = person.user_id == current_user.id
    is_admin = current_user.role.value in ("ADMIN", "HR")
    if not is_own and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    profile = db.query(CompensationProfile).filter(CompensationProfile.person_id == person_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No compensation profile found")
    return profile


# ── Payouts ──────────────────────────────────────────────────────

@router.post("/payouts/run-month", response_model=list[PayoutResponse], status_code=201)
def run_month_payouts(
    data: PayoutRunRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Admin: bulk create payout entries for a month for all paid persons (or specific person_ids)."""
    q = db.query(CompensationProfile).filter(CompensationProfile.comp_type != CompType.UNPAID)
    if data.person_ids:
        q = q.filter(CompensationProfile.person_id.in_(data.person_ids))

    profiles = q.all()
    created = []
    for profile in profiles:
        # Skip if payout already exists for this month
        existing = db.query(Payout).filter(
            Payout.person_id == profile.person_id,
            Payout.period_month == data.period_month,
        ).first()
        if existing:
            continue

        payout = Payout(
            person_id=profile.person_id,
            period_month=data.period_month,
            amount=profile.amount or 0,
            status=PayoutStatus.PENDING,
        )
        db.add(payout)
        created.append(payout)

    db.commit()
    for p in created:
        db.refresh(p)

    record_audit(db, current_user.id, "Payout", 0, "BULK_CREATE",
                 after={"month": data.period_month, "count": len(created)}, request=request)
    return created


@router.patch("/payouts/{payout_id}/mark-paid", response_model=PayoutResponse)
def mark_paid(
    payout_id: int,
    data: PayoutMarkPaidRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Admin: mark a payout as paid and auto-generate a payslip stub."""
    payout = db.query(Payout).filter(Payout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    if payout.status == PayoutStatus.PAID:
        raise HTTPException(status_code=400, detail="Already marked as paid")

    payout.status = PayoutStatus.PAID
    payout.paid_at = datetime.now(timezone.utc)
    payout.reference_id = data.reference_id

    # Auto-create payslip stub
    payslip = Payslip(
        payout_id=payout.id,
        file_key=f"payslips/{payout.person_id}/{payout.period_month}.pdf",
    )
    db.add(payslip)
    db.commit()
    db.refresh(payout)

    record_audit(db, current_user.id, "Payout", payout.id, "MARK_PAID",
                 after={"reference_id": data.reference_id}, request=request)
    return payout


# ── Payslips ─────────────────────────────────────────────────────

@router.get("/me/payslips", response_model=list[PayslipResponse])
def my_payslips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self-service: list own payslips."""
    person = db.query(Person).filter(Person.user_id == current_user.id).first()
    if not person:
        return []

    payouts = db.query(Payout).filter(Payout.person_id == person.id).all()
    payout_ids = [p.id for p in payouts]
    if not payout_ids:
        return []

    return db.query(Payslip).filter(Payslip.payout_id.in_(payout_ids)).order_by(Payslip.generated_at.desc()).all()


@router.get("/payslips/{payslip_id}/download-url", response_model=PayslipDownloadResponse)
def payslip_download(
    payslip_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get download URL for a payslip."""
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")

    # Access check
    payout = db.query(Payout).filter(Payout.id == payslip.payout_id).first()
    person = db.query(Person).filter(Person.id == payout.person_id).first() if payout else None
    is_own = person and person.user_id == current_user.id
    is_admin = current_user.role.value in ("ADMIN",)
    if not is_own and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    record_audit(db, current_user.id, "Payslip", payslip.id, "DOWNLOAD", request=request)
    return PayslipDownloadResponse(download_url=f"/uploads/{payslip.file_key}")
