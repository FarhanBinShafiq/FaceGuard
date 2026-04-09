"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Registration ─────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Registration request (image sent as form data, name as field)."""
    name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    email: Optional[str] = Field(None, description="Optional email address")


class RegisterResponse(BaseModel):
    """Registration response."""
    success: bool
    message: str
    user_id: Optional[str] = None
    name: Optional[str] = None
    confidence: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None


# ── Verification ─────────────────────────────────────────

class VerifyResponse(BaseModel):
    """Verification response."""
    status: str = Field(..., description="'registered_user' or 'new_user'")
    message: str
    user_id: Optional[str] = None
    name: Optional[str] = None
    confidence: Optional[float] = None
    distance: Optional[float] = None
    anti_spoof_score: Optional[float] = None
    is_real_face: bool = True


# ── User Management ─────────────────────────────────────

class UserOut(BaseModel):
    """User response model."""
    id: str
    name: str
    email: Optional[str] = None
    image_path: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """List of users response."""
    total: int
    users: list[UserOut]


# ── System ───────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    total_users: int
    faiss_index_size: int


class StatsResponse(BaseModel):
    """System statistics response."""
    total_users: int
    faiss_index_size: int
    embedding_dim: int
    similarity_threshold: float
    anti_spoof_enabled: bool


class ErrorResponse(BaseModel):
    """Error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None


# ── Supermarket Analytics ───────────────────────────────

class FaceAnalysisInfo(BaseModel):
    """Information for a single detected face."""
    id: int
    bbox: list[float]
    age: Optional[int] = None
    gender: Optional[str] = None
    confidence: float
    matched_name: Optional[str] = None
    matched_id: Optional[str] = None


class CrowdAnalysisResponse(BaseModel):
    """Response for crowd/supermarket analysis."""
    total_faces: int
    faces: list[FaceAnalysisInfo]
    timestamp: datetime = Field(default_factory=datetime.now)
