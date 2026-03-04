"""
People router – admin CRUD + self-service profile endpoints.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.person import Person, PersonType, PersonStatus
from app.schemas.person import (
    PersonCreate, PersonUpdate, PersonSelfUpdate,
    PersonResponse, PersonListResponse,
)
from app.id_generator import generate_person_code
from app.audit import record_audit

router = APIRouter(prefix="/api/v1", tags=["People"])


# ── Admin endpoints ──────────────────────────────────────────────

@router.post("/people", response_model=PersonResponse, status_code=201)
def create_person(
    data: PersonCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin creates a new person. Server generates the unique person_code."""
    ptype = PersonType(data.person_type)
    code = generate_person_code(db, ptype)

    person = Person(
        person_code=code,
        person_type=ptype,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        address=data.address,
        department=data.department,
        manager_id=data.manager_id,
        join_date=data.join_date,
        end_date=data.end_date,
        status=PersonStatus.DRAFT,
    )
    db.add(person)
    db.commit()
    db.refresh(person)

    record_audit(db, current_user.id, "Person", person.id, "CREATE", after={"person_code": code}, request=request)
    return person


@router.get("/people", response_model=PersonListResponse)
def list_people(
    person_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin list/search people with filters."""
    q = db.query(Person).filter(Person.is_deleted == False)  # noqa: E712
    if person_type:
        q = q.filter(Person.person_type == PersonType(person_type))
    if status:
        q = q.filter(Person.status == PersonStatus(status))
    if department:
        q = q.filter(Person.department.ilike(f"%{department}%"))
    if search:
        q = q.filter(Person.full_name.ilike(f"%{search}%"))

    total = q.count()
    items = q.order_by(Person.id).offset(skip).limit(limit).all()
    return PersonListResponse(items=items, total=total)


@router.get("/people/{person_id}", response_model=PersonResponse)
def get_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin get person detail."""
    person = db.query(Person).filter(Person.id == person_id, Person.is_deleted == False).first()  # noqa: E712
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.patch("/people/{person_id}", response_model=PersonResponse)
def update_person(
    person_id: int,
    data: PersonUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin update person fields."""
    person = db.query(Person).filter(Person.id == person_id, Person.is_deleted == False).first()  # noqa: E712
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    before = {c.name: getattr(person, c.name) for c in Person.__table__.columns}
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}

    # Convert string enums
    if "person_type" in update_data and update_data["person_type"]:
        update_data["person_type"] = PersonType(update_data["person_type"])
    if "status" in update_data and update_data["status"]:
        update_data["status"] = PersonStatus(update_data["status"])

    for key, value in update_data.items():
        setattr(person, key, value)

    db.commit()
    db.refresh(person)

    after = {c.name: getattr(person, c.name) for c in Person.__table__.columns}
    record_audit(db, current_user.id, "Person", person.id, "UPDATE",
                 before={k: str(v) for k, v in before.items()},
                 after={k: str(v) for k, v in after.items()},
                 request=request)
    return person


# ── Self-service profile ─────────────────────────────────────────

@router.get("/me/profile", response_model=PersonResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self-service: view own person profile."""
    person = db.query(Person).filter(Person.user_id == current_user.id, Person.is_deleted == False).first()  # noqa: E712
    if not person:
        raise HTTPException(status_code=404, detail="No person record linked to your account")
    return person


@router.patch("/me/profile", response_model=PersonResponse)
def update_my_profile(
    data: PersonSelfUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self-service: update limited fields (phone, address)."""
    person = db.query(Person).filter(Person.user_id == current_user.id, Person.is_deleted == False).first()  # noqa: E712
    if not person:
        raise HTTPException(status_code=404, detail="No person record linked to your account")

    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
    for key, value in update_data.items():
        setattr(person, key, value)

    db.commit()
    db.refresh(person)
    record_audit(db, current_user.id, "Person", person.id, "SELF_UPDATE", after=update_data, request=request)
    return person
