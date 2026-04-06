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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self):
        return f"<User(id={self.id}, name={self.name})>"
