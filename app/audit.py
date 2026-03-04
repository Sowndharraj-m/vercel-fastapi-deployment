"""
Audit log helper – records every important action for traceability.
"""
from typing import Optional
from datetime import datetime, timezone

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def record_audit(
    db: Session,
    actor_user_id: Optional[int],
    entity_type: str,
    entity_id: int,
    action: str,
    before: Optional[dict] = None,
    after: Optional[dict] = None,
    request: Optional[Request] = None,
):
    """Create an audit log entry."""
    ip = None
    user_agent = None
    if request:
        ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

    entry = AuditLog(
        actor_user_id=actor_user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        before_json=before,
        after_json=after,
        timestamp=datetime.now(timezone.utc),
        ip_address=ip,
        user_agent=user_agent,
    )
    db.add(entry)
    db.commit()
    return entry
