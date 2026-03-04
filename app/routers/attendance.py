"""
Attendance router – check-in/out, daily mark, self/admin queries, admin override.
"""
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.person import Person
from app.models.attendance import AttendanceRecord, AttendanceStatus
from app.schemas.attendance import (
    AttendanceCheckInRequest, AttendanceCheckOutRequest,
    AttendanceMarkRequest, AttendanceUpdateRequest,
    AttendanceResponse, AttendanceSummary,
)
from app.audit import record_audit

router = APIRouter(prefix="/api/v1/attendance", tags=["Attendance"])


def _get_person_for_user(db: Session, user: User) -> Person:
    person = db.query(Person).filter(Person.user_id == user.id).first()
    if not person:
        raise HTTPException(status_code=404, detail="No person record linked to your account")
    return person


@router.post("/check-in", response_model=AttendanceResponse, status_code=201)
def check_in(
    data: AttendanceCheckInRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self-service: check in for today."""
    person = _get_person_for_user(db, current_user)
    today = date.today()

    # Check for existing record today
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.person_id == person.id,
        AttendanceRecord.date == today,
    ).first()

    if existing and existing.check_in:
        raise HTTPException(status_code=400, detail="Already checked in today")

    now = datetime.now(timezone.utc)
    if existing:
        existing.check_in = now
        existing.status = AttendanceStatus.PRESENT
        if data.notes:
            existing.notes = data.notes
        db.commit()
        db.refresh(existing)
        return existing

    record = AttendanceRecord(
        person_id=person.id,
        date=today,
        check_in=now,
        status=AttendanceStatus.PRESENT,
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    data: AttendanceCheckOutRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self-service: check out for today."""
    person = _get_person_for_user(db, current_user)
    today = date.today()

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.person_id == person.id,
        AttendanceRecord.date == today,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="No check-in found for today")
    if record.check_out:
        raise HTTPException(status_code=400, detail="Already checked out today")

    record.check_out = datetime.now(timezone.utc)
    if data.notes:
        record.notes = (record.notes or "") + f" | Checkout: {data.notes}"
    db.commit()
    db.refresh(record)
    return record


@router.post("/mark", response_model=AttendanceResponse, status_code=201)
def mark_attendance(
    data: AttendanceMarkRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self-service: mark daily attendance status."""
    person = _get_person_for_user(db, current_user)

    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.person_id == person.id,
        AttendanceRecord.date == data.date,
    ).first()

    att_status = AttendanceStatus(data.status)

    if existing:
        existing.status = att_status
        existing.notes = data.notes
        existing.updated_by = current_user.id
        db.commit()
        db.refresh(existing)
        return existing

    record = AttendanceRecord(
        person_id=person.id,
        date=data.date,
        status=att_status,
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/me", response_model=list[AttendanceResponse])
def my_attendance(
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self-service: view own attendance records."""
    person = _get_person_for_user(db, current_user)
    q = db.query(AttendanceRecord).filter(AttendanceRecord.person_id == person.id)
    if date_from:
        q = q.filter(AttendanceRecord.date >= date_from)
    if date_to:
        q = q.filter(AttendanceRecord.date <= date_to)
    return q.order_by(AttendanceRecord.date.desc()).all()


@router.get("", response_model=list[AttendanceResponse])
def list_attendance(
    person_id: int = Query(...),
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin: query attendance records for a person."""
    q = db.query(AttendanceRecord).filter(AttendanceRecord.person_id == person_id)
    if date_from:
        q = q.filter(AttendanceRecord.date >= date_from)
    if date_to:
        q = q.filter(AttendanceRecord.date <= date_to)
    return q.order_by(AttendanceRecord.date.desc()).all()


@router.patch("/{record_id}", response_model=AttendanceResponse)
def override_attendance(
    record_id: int,
    data: AttendanceUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin: override/edit an attendance record with reason."""
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    before = {"status": record.status.value, "notes": record.notes}

    if data.status:
        record.status = AttendanceStatus(data.status)
    if data.check_in is not None:
        record.check_in = data.check_in
    if data.check_out is not None:
        record.check_out = data.check_out
    if data.notes:
        record.notes = (record.notes or "") + f" | Override: {data.notes}"

    record.updated_by = current_user.id
    db.commit()
    db.refresh(record)

    record_audit(db, current_user.id, "AttendanceRecord", record.id, "ADMIN_OVERRIDE",
                 before=before,
                 after={"status": record.status.value, "reason": data.override_reason},
                 request=request)
    return record


@router.get("/summary", response_model=AttendanceSummary)
def attendance_summary(
    person_id: int = Query(...),
    date_from: date = Query(..., alias="from"),
    date_to: date = Query(..., alias="to"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin: monthly attendance summary for a person."""
    records = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.person_id == person_id,
            AttendanceRecord.date >= date_from,
            AttendanceRecord.date <= date_to,
        )
        .all()
    )

    summary = AttendanceSummary(
        person_id=person_id,
        period_from=date_from,
        period_to=date_to,
    )
    for r in records:
        if r.status == AttendanceStatus.PRESENT:
            summary.total_present += 1
        elif r.status == AttendanceStatus.ABSENT:
            summary.total_absent += 1
        elif r.status == AttendanceStatus.HALF_DAY:
            summary.total_half_day += 1
        elif r.status == AttendanceStatus.LEAVE:
            summary.total_leave += 1
        elif r.status == AttendanceStatus.HOLIDAY:
            summary.total_holiday += 1

    return summary
