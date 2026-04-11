"""
User Management API.
CRUD operations for registered users.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import UserOut, UserListResponse, HealthResponse, StatsResponse, ErrorResponse
from app.services.embedding_store import get_embedding_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Users"])


@router.get(
    "/users",
    response_model=UserListResponse,
    summary="List all registered users",
)
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get a list of all registered users."""
    total = db.query(User).count()
    users = db.query(User).offset(skip).limit(limit).all()
    return UserListResponse(
        total=total,
        users=[UserOut.model_validate(u) for u in users],
    )


@router.get(
    "/users/{user_id}",
    response_model=UserOut,
    responses={404: {"model": ErrorResponse}},
    summary="Get user details",
)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get details for a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserOut.model_validate(user)


@router.get(
    "/users/{user_id}/image",
    summary="Get user's face image",
    responses={404: {"model": ErrorResponse}},
)
async def get_user_image(user_id: str, db: Session = Depends(get_db)):
    """Get the stored face image for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.image_path:
        raise HTTPException(status_code=404, detail="User or image not found.")

    image_path = settings.IMAGES_DIR / user.image_path
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found on disk.")

    return FileResponse(str(image_path), media_type="image/jpeg")


@router.delete(
    "/users/{user_id}",
    response_model=dict,
    responses={404: {"model": ErrorResponse}},
    summary="Delete a user",
)
async def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Delete a user and their face data."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Remove from FAISS
    store = get_embedding_store()
    store.remove_user(user_id)

    # Remove image file
    if user.image_path:
        image_path = settings.IMAGES_DIR / user.image_path
        if image_path.exists():
            image_path.unlink()

    # Remove from DB
    name = user.name
    db.delete(user)
    db.commit()

    logger.info(f"Deleted user: {name} (ID: {user_id})")
    return {"success": True, "message": f"User '{name}' deleted successfully."}


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
)
async def health_check(db: Session = Depends(get_db)):
    """System health check."""
    total_users = db.query(User).count()
    store = get_embedding_store()
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        total_users=total_users,
        faiss_index_size=store.total,
    )


@router.get(
    "/stats",
    response_model=StatsResponse,
    summary="System statistics",
)
async def system_stats(db: Session = Depends(get_db)):
    """Get system statistics."""
    total_users = db.query(User).count()
    store = get_embedding_store()
    return StatsResponse(
        total_users=total_users,
        faiss_index_size=store.total,
        embedding_dim=settings.EMBEDDING_DIM,
        similarity_threshold=settings.SIMILARITY_THRESHOLD,
        anti_spoof_enabled=settings.ANTI_SPOOF_ENABLED,
    )
@router.patch(
    "/users/{user_id}/role",
    response_model=UserOut,
    responses={404: {"model": ErrorResponse}},
    summary="Update user role (e.g., blacklist, vip)",
)
async def update_user_role(user_id: str, role: str, db: Session = Depends(get_db)):
    """Update a user's role and security status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.role = role
    db.commit()
    db.refresh(user)

    logger.info(f"Updated user role: {user.name} -> {role}")
    return UserOut.model_validate(user)
