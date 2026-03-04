"""
Compensation, Payout, and Payslip ORM models.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, Enum, ForeignKey, Text,
)
from app.database import Base


class CompType(str, enum.Enum):
    UNPAID = "UNPAID"
    STIPEND_FIXED = "STIPEND_FIXED"
    SALARY = "SALARY"


class PayoutStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"


class CompensationProfile(Base):
    __tablename__ = "compensation_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False, index=True)
    comp_type = Column(Enum(CompType), nullable=False, default=CompType.UNPAID)
    amount = Column(Float, nullable=True)
    currency = Column(String(10), nullable=False, default="INR")
    effective_from = Column(Date, nullable=True)
    bank_details_encrypted = Column(Text, nullable=True)  # plaintext for MVP; encrypt later
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False, index=True)
    period_month = Column(String(7), nullable=False)  # "YYYY-MM"
    amount = Column(Float, nullable=False)
    status = Column(Enum(PayoutStatus), nullable=False, default=PayoutStatus.PENDING)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    reference_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    payout_id = Column(Integer, ForeignKey("payouts.id"), nullable=False, index=True)
    file_key = Column(String(500), nullable=True)
    generated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
