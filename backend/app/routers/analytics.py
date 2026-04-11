"""
Supermarket Analytics Router.
Handles multi-face detection, attribute extraction, and crowd analysis.
"""

import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import CrowdAnalysisResponse, FaceAnalysisInfo, ErrorResponse
from app.services.face_service import get_face_service
from app.services.embedding_store import get_embedding_store
from app.utils.image_utils import (
    decode_upload_image,
    decode_base64_image,
    validate_image,
    resize_image,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.post(
    "/crowd",
    response_model=CrowdAnalysisResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Analyze crowd in an image",
    description="Detect multiple faces, estimate age/gender, and identify registered users.",
)
async def analyze_crowd(
    image: Optional[UploadFile] = File(None, description="Crowd image file"),
    image_base64: Optional[str] = Form(None, description="Base64-encoded crowd image"),
    db: Session = Depends(get_db),
):
    """Detect and analyze all faces in the provided frame."""
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
            raise HTTPException(status_code=400, detail="No image provided.")

        if cv_image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image.")

        # For crowd analysis, we might want higher resolution if many people are far away,
        # but for now, we'll keep the standard resize.
        cv_image = resize_image(cv_image)

        # ── 2. Detect all faces ──
        face_service = get_face_service()
        faces = face_service.detect_faces(cv_image)
        
        # ── 3. Initialize FAISS store for identification ──
        store = get_embedding_store()
        
        face_results = []
        for i, face in enumerate(faces):
            # Extract attributes
            attrs = face_service.get_face_attributes(face)
            bbox = face_service.get_face_bbox(face)
            
            # Identify face
            embedding = face_service.extract_embedding(face)
            matched_name = None
            matched_id = None
            
            if embedding is not None:
                user_id, similarity = store.find_match(embedding)
                if user_id:
                    user = db.query(User).filter(User.id == user_id).first()
                    if user:
                        matched_name = user.name
                        matched_id = user.id

            face_info = FaceAnalysisInfo(
                id=i,
                bbox=bbox,
                age=attrs.get("age"),
                gender=attrs.get("gender"),
                confidence=attrs.get("detection_confidence", 0.0),
                matched_name=matched_name,
                matched_id=matched_id
            )
            face_results.append(face_info)

        logger.info(f"Crowd analysis: detected {len(face_results)} faces.")
        return CrowdAnalysisResponse(
            total_faces=len(face_results),
            faces=face_results
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Crowd analysis failed")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
