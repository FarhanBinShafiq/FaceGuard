"""
SQLAlchemy ORM models for the Face Recognition System.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, LargeBinary, DateTime, Text
from app.database import Base


class User(Base):
    """Registered user with face embedding."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=True, unique=True)
    embedding = Column(LargeBinary, nullable=False)  # 512-d float32 → 2048 bytes
    image_path = Column(Text, nullable=True)
    age = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    role = Column(String(50), default="customer") # customer, staff, vip, blacklisted
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class AuditLog(Base):
    """Logs of all verification and registration events."""

    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String(50), nullable=False)  # verify, register, delete
    status = Column(String(50), nullable=False)      # success, spoof_detected, failed
    user_id = Column(String(36), nullable=True)
    user_name = Column(String(255), nullable=True)
    confidence = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    snapshot_path = Column(Text, nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, name={self.name})>"
