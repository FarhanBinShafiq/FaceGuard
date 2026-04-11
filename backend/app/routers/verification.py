"""
Face Verification API.
Accepts an image, detects the face, and checks against registered users.
"""

import logging
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User, AuditLog
from app.schemas import VerifyResponse, ErrorResponse
from app.services.face_service import get_face_service
from app.services.anti_spoof import get_anti_spoof_service
from app.services.embedding_store import get_embedding_store
from app.utils.image_utils import (
    decode_upload_image,
    decode_base64_image,
    validate_image,
    resize_image,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Verification"])


@router.post(
    "/verify",
    response_model=VerifyResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Verify a face against registered users",
    description="Upload a face image to verify identity. Returns 'registered_user' with identity "
                "and confidence, or 'new_user' if no match is found.",
)
async def verify_face(
    image: Optional[UploadFile] = File(None, description="Face image file"),
    image_base64: Optional[str] = Form(None, description="Base64-encoded face image"),
    threshold: Optional[float] = Form(None, description="Custom similarity threshold (0.0-1.0)"),
    db: Session = Depends(get_db),
):
    """Verify a face against the database of registered users."""
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
            raise HTTPException(status_code=400, detail="Failed to decode image.")

        cv_image = resize_image(cv_image)

        # ── 2. Detect face ──
        face_service = get_face_service()
        face, error = face_service.get_single_face(cv_image)

        if face is None:
            return VerifyResponse(
                status="error",
                message=error,
                is_real_face=False,
            )

        # ── 3. Anti-spoofing ──
        anti_spoof = get_anti_spoof_service()
        bbox = face_service.get_face_bbox(face)
        is_real, spoof_score, spoof_details = anti_spoof.check_liveness(cv_image, bbox)

        if not is_real:
            return VerifyResponse(
                status="spoof_detected",
                message="Anti-spoofing check failed. The image appears to be a photo of a screen or printed picture.",
                anti_spoof_score=round(spoof_score, 4),
                is_real_face=False,
            )

        # ── 4. Extract embedding ──
        embedding = face_service.extract_embedding(face)
        if embedding is None:
            raise HTTPException(status_code=500, detail="Failed to extract face embedding.")

        # ── 5. Search FAISS index ──
        store = get_embedding_store()

        # Use custom threshold if provided
        original_threshold = store.threshold
        if threshold is not None:
            store.threshold = threshold

        matched_user_id, similarity = store.find_match(embedding)

        # Restore threshold
        store.threshold = original_threshold

        distance = 1.0 - similarity if similarity > 0 else 1.0

        # ── 6. Build response ──
        emotion = face_service.get_emotion(face)
        alert_triggered = False

        if matched_user_id:
            user = db.query(User).filter(User.id == matched_user_id).first()
            if user:
                # Blacklist Check
                if user.role == "blacklisted":
                    alert_triggered = True
                    logger.warning(f"🚨 ALERT: Blacklisted user detected: {user.name}")

                logger.info(f"Verified: {user.name} (Role: {user.role}, similarity: {similarity:.4f})")
                
                # Log success
                log = AuditLog(
                    event_type="verify",
                    status="success",
                    user_id=user.id,
                    user_name=user.name,
                    confidence=str(round(similarity, 4)),
                    is_alert="true" if alert_triggered else "false"
                )
                db.add(log)
                db.commit()

                return VerifyResponse(
                    status="registered_user",
                    message=f"Registered User: {user.name}",
                    user_id=user.id,
                    name=user.name,
                    confidence=round(similarity, 4),
                    distance=round(distance, 4),
                    anti_spoof_score=round(spoof_score, 4),
                    is_real_face=True,
                    role=user.role,
                    emotion=emotion,
                    alert_triggered=alert_triggered
                )

        logger.info(f"No match found (best similarity: {similarity:.4f})")
        
        # Log failure
        log = AuditLog(
            event_type="verify",
            status="failed",
            confidence=str(round(similarity, 4)) if similarity > 0 else None
        )
        db.add(log)
        db.commit()

        return VerifyResponse(
            status="new_user",
            message="New User — face not recognized in the database.",
            confidence=round(similarity, 4) if similarity > 0 else None,
            distance=round(distance, 4) if similarity > 0 else None,
            anti_spoof_score=round(spoof_score, 4),
            is_real_face=True,
            role="unknown",
            emotion=emotion,
            alert_triggered=False
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Verification failed")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
