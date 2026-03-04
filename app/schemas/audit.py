"""
Audit log response schemas.
"""
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: int
    actor_user_id: Optional[int] = None
    entity_type: str
    entity_id: int
    action: str
    before_json: Optional[Any] = None
    after_json: Optional[Any] = None
    timestamp: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
