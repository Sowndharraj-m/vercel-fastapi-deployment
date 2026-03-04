"""
Person ORM model – unified registry for interns, employees, students.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Enum, ForeignKey, Boolean, Text,
)
from app.database import Base


class PersonType(str, enum.Enum):
    INTERN = "INTERN"
    EMPLOYEE = "EMPLOYEE"
    STUDENT = "STUDENT"


class PersonStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    INVITED = "INVITED"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    EXITED = "EXITED"


class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    person_code = Column(String(20), unique=True, nullable=False, index=True)
    person_type = Column(Enum(PersonType), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(Text, nullable=True)

    department = Column(String(100), nullable=True)
    manager_id = Column(Integer, ForeignKey("persons.id"), nullable=True)
    join_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(Enum(PersonStatus), nullable=False, default=PersonStatus.DRAFT)

    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
