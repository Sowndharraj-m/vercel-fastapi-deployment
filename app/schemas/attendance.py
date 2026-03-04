"""
Attendance request/response schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class AttendanceCheckInRequest(BaseModel):
    notes: Optional[str] = None


class AttendanceCheckOutRequest(BaseModel):
    notes: Optional[str] = None


class AttendanceMarkRequest(BaseModel):
    date: date
    status: str = Field(..., description="PRESENT | ABSENT | HALF_DAY | LEAVE | HOLIDAY")
    notes: Optional[str] = None


class AttendanceUpdateRequest(BaseModel):
    status: Optional[str] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    notes: Optional[str] = None
    override_reason: str = Field(..., description="Reason for admin override")


class AttendanceResponse(BaseModel):
    id: int
    person_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    person_id: int
    period_from: date
    period_to: date
    total_present: int = 0
    total_absent: int = 0
    total_half_day: int = 0
    total_leave: int = 0
    total_holiday: int = 0
