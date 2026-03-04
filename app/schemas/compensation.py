"""
Compensation, Payout, and Payslip schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class CompensationProfileCreate(BaseModel):
    comp_type: str = Field(..., description="UNPAID | STIPEND_FIXED | SALARY")
    amount: Optional[float] = None
    currency: str = "INR"
    effective_from: Optional[date] = None
    bank_details: Optional[str] = None  # stored as text for MVP


class CompensationProfileResponse(BaseModel):
    id: int
    person_id: int
    comp_type: str
    amount: Optional[float] = None
    currency: str
    effective_from: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PayoutRunRequest(BaseModel):
    period_month: str = Field(..., pattern=r"^\d{4}-\d{2}$", description="YYYY-MM")
    person_ids: Optional[list[int]] = None  # None = all paid persons


class PayoutResponse(BaseModel):
    id: int
    person_id: int
    period_month: str
    amount: float
    status: str
    paid_at: Optional[datetime] = None
    reference_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PayoutMarkPaidRequest(BaseModel):
    reference_id: Optional[str] = None


class PayslipResponse(BaseModel):
    id: int
    payout_id: int
    file_key: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class PayslipDownloadResponse(BaseModel):
    download_url: str
