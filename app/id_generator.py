"""
Server-side unique ID code generator for people.
Generates padded codes like EMP000001, INP001, STU001.
Codes are never re-used (soft-delete friendly).
"""
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.person import Person, PersonType

# Prefix and padding config per person type
_CODE_CONFIG = {
    PersonType.EMPLOYEE: {"prefix": "EMP", "pad": 6},
    PersonType.INTERN:   {"prefix": "INP", "pad": 3},
    PersonType.STUDENT:  {"prefix": "STU", "pad": 3},
}


def generate_person_code(db: Session, person_type: PersonType) -> str:
    """
    Generate the next sequential code for a given person type.
    Thread-safety relies on DB unique constraint on person_code.
    """
    config = _CODE_CONFIG.get(person_type)
    if not config:
        raise ValueError(f"No code config for person type: {person_type}")

    prefix = config["prefix"]
    pad = config["pad"]

    # Count ALL persons of this type (including deleted) to avoid reuse
    count = (
        db.query(func.count(Person.id))
        .filter(Person.person_type == person_type)
        .scalar()
    ) or 0

    next_num = count + 1
    return f"{prefix}{str(next_num).zfill(pad)}"
