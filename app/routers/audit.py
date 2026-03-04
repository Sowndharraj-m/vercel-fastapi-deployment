"""
Audit log query router – admin only.
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse, AuditLogListResponse

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Logs"])


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    actor_user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Admin: query audit logs with optional filters."""
    q = db.query(AuditLog)
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        q = q.filter(AuditLog.entity_id == entity_id)
    if actor_user_id:
        q = q.filter(AuditLog.actor_user_id == actor_user_id)
    if action:
        q = q.filter(AuditLog.action == action)

    total = q.count()
    items = q.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return AuditLogListResponse(items=items, total=total)
