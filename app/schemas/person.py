"""
Person request/response schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class PersonCreate(BaseModel):
    person_type: str = Field(..., description="INTERN | EMPLOYEE | STUDENT")
    full_name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[int] = None
    join_date: Optional[date] = None
    end_date: Optional[date] = None


class PersonUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[int] = None
    join_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    person_type: Optional[str] = None


class PersonSelfUpdate(BaseModel):
    """Limited fields editable by the person themselves."""
    phone: Optional[str] = None
    address: Optional[str] = None


class PersonResponse(BaseModel):
    id: int
    person_code: str
    person_type: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[int] = None
    join_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PersonListResponse(BaseModel):
    items: list[PersonResponse]
    total: int
