"""
Audit Logs Router.
Fetches logs of all biometric events for enterprise monitoring.
"""

import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditListResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/audits", tags=["Audits"])


@router.get(
    "/",
    response_model=AuditListResponse,
    summary="Get all audit logs",
    description="Fetch a list of all biometric events (registration, verification) logged in the system.",
)
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    event_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Fetch logs from the audit_logs table."""
    query = db.query(AuditLog)
    
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
        
    total = query.count()
    logs = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit).all()
    
    return AuditListResponse(
        total=total,
        logs=logs
    )
