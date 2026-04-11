"""
User Registration API.
Handles face registration: detect face, extract embedding, store in DB + FAISS.
"""

import logging
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User, AuditLog
from app.schemas import RegisterResponse, ErrorResponse
from app.services.face_service import get_face_service
from app.services.anti_spoof import get_anti_spoof_service
from app.services.embedding_store import get_embedding_store
from app.utils.image_utils import (
    decode_upload_image,
    decode_base64_image,
    validate_image,
    save_face_image,
    resize_image,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Registration"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Register a new user with face image",
    description="Upload a face image to register a new user. The system detects the face, "
                "extracts embeddings, performs anti-spoofing checks, and stores the user.",
)
async def register_user(
    name: str = Form(..., description="User's full name"),
    email: Optional[str] = Form(None, description="Optional email address"),
    role: str = Form("customer", description="customer, staff, vip, blacklisted"),
    image: Optional[UploadFile] = File(None, description="Face image file"),
    image_base64: Optional[str] = Form(None, description="Base64-encoded face image"),
    db: Session = Depends(get_db),
):
    """Register a new user with their face."""
    try:
        # ── 1. Get image ──
        if image:
            file_bytes = await image.read()
            is_valid, err = validate_image(file_bytes, image.filename or "upload.jpg")
            if not is_valid:
                raise HTTPException(status_code=400, detail=err)
            cv_image = decode_upload_image(file_bytes)
        elif image_base64:
            cv_image = decode_base64_image(image_base64)
        else:
            raise HTTPException(status_code=400, detail="No image provided. Send 'image' file or 'image_base64'.")

        if cv_image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image. Ensure it's a valid image file.")

        # Resize for performance
        cv_image = resize_image(cv_image)

        # ── 2. Detect face ──
        face_service = get_face_service()
        face, error = face_service.get_single_face(cv_image)

        if face is None:
            raise HTTPException(status_code=400, detail=error)

        # ── 3. Anti-spoofing check ──
        anti_spoof = get_anti_spoof_service()
        bbox = face_service.get_face_bbox(face)
        is_real, spoof_score, spoof_details = anti_spoof.check_liveness(cv_image, bbox)

        if not is_real:
            raise HTTPException(
                status_code=400,
                detail=f"Anti-spoofing check failed (score: {spoof_score:.2f}). "
                       "Image may be a photo of a screen or printed picture.",
            )

        # ── 4. Extract embedding ──
        embedding = face_service.extract_embedding(face)
        if embedding is None:
            raise HTTPException(status_code=500, detail="Failed to extract face embedding.")

        # ── 5. Check for duplicates ──
        store = get_embedding_store()
        is_dup, dup_user_id, dup_sim = store.check_duplicate(embedding)

        if is_dup:
            dup_user = db.query(User).filter(User.id == dup_user_id).first()
            dup_name = dup_user.name if dup_user else "Unknown"
            raise HTTPException(
                status_code=409,
                detail={
                    "message": f"This face is already registered as '{dup_name}'.",
                    "existing_user_id": dup_user_id,
                    "existing_user_name": dup_name,
                    "similarity": f"{dup_sim:.2%}",
                    "suggestion": "If you want to update this profile, use the update endpoint with the provided User ID."
                }
            )

        # ── 6. Check email uniqueness ──
        if email:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Email '{email}' is already registered.")

        # ── 7. Create user ──
        # Generate ID now so we can use it for the image filename
        import uuid
        user_id = str(uuid.uuid4())

        # Extract age/gender
        attrs = face_service.get_face_attributes(face)
        user_age = attrs.get("age")
        user_gender = attrs.get("gender")

        user = User(
            id=user_id,
            name=name,
            email=email,
            embedding=embedding.tobytes(),
            age=str(user_age) if user_age else None,
            gender=user_gender,
            role=role,
        )

        # Save face image (now user.id is valid)
        image_path = save_face_image(cv_image, user.id, bbox)
        user.image_path = image_path

        db.add(user)
        
        # Log event
        log = AuditLog(
            event_type="register",
            status="success",
            user_id=user.id,
            user_name=user.name,
            snapshot_path=image_path
        )
        db.add(log)
        
        db.commit()
        db.refresh(user)

        # ── 8. Add to FAISS index ──
        store.add_embedding(user.id, embedding)

        logger.info(f"Registered user: {user.name} (ID: {user.id}), Role: {role}")

        return RegisterResponse(
            success=True,
            message=f"User '{name}' registered successfully.",
            user_id=user.id,
            name=user.name,
            confidence=round(spoof_score, 4),
            age=user_age,
            gender=user_gender,
            role=user.role,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Registration failed")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
