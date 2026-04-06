"""
Image processing utilities.
Handles image decoding, validation, and format conversion.
"""

import io
import base64
import logging
import cv2
import numpy as np
from typing import Optional, Tuple
from app.config import settings

logger = logging.getLogger(__name__)


def decode_upload_image(file_bytes: bytes) -> Optional[np.ndarray]:
    """
    Decode uploaded image bytes to OpenCV BGR numpy array.

    Args:
        file_bytes: Raw image file bytes.

    Returns:
        BGR numpy array or None if decoding fails.
    """
    try:
        np_arr = np.frombuffer(file_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None:
            logger.warning("Failed to decode image bytes.")
            return None
        return image
    except Exception as e:
        logger.error(f"Image decode error: {e}")
        return None


def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
    """
    Decode a base64-encoded image string to OpenCV BGR numpy array.

    Args:
        base64_str: Base64 encoded image (optionally with data URI prefix).

    Returns:
        BGR numpy array or None.
    """
    try:
        # Strip data URI prefix if present
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        img_bytes = base64.b64decode(base64_str)
        return decode_upload_image(img_bytes)
    except Exception as e:
        logger.error(f"Base64 decode error: {e}")
        return None


def validate_image(file_bytes: bytes, filename: str) -> Tuple[bool, str]:
    """
    Validate image file size and extension.

    Returns:
        (is_valid, error_message)
    """
    if len(file_bytes) > settings.MAX_IMAGE_SIZE:
        return False, f"Image too large. Maximum size: {settings.MAX_IMAGE_SIZE // (1024*1024)} MB"

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        return False, f"Invalid file type '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"

    return True, ""


def save_face_image(image: np.ndarray, user_id: str, face_bbox: list = None) -> str:
    """
    Save a face image to disk.

    Args:
        image: Full BGR image.
        user_id: User ID for filename.
        face_bbox: Optional bounding box to crop face.

    Returns:
        Relative path to saved image.
    """
    if face_bbox:
        x1, y1, x2, y2 = [int(c) for c in face_bbox]
        h, w = image.shape[:2]
        # Add 20% padding
        pad_w = int((x2 - x1) * 0.2)
        pad_h = int((y2 - y1) * 0.2)
        x1 = max(0, x1 - pad_w)
        y1 = max(0, y1 - pad_h)
        x2 = min(w, x2 + pad_w)
        y2 = min(h, y2 + pad_h)
        face_img = image[y1:y2, x1:x2]
    else:
        face_img = image

    filename = f"{user_id}.jpg"
    filepath = settings.IMAGES_DIR / filename
    cv2.imwrite(str(filepath), face_img)
    logger.info(f"Saved face image: {filepath}")
    return filename


def image_to_base64(image: np.ndarray, quality: int = 85) -> str:
    """Convert OpenCV image to base64 JPEG string."""
    _, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return base64.b64encode(buffer).decode("utf-8")


def resize_image(image: np.ndarray, max_dim: int = 1024) -> np.ndarray:
    """Resize image so largest dimension is at most max_dim."""
    h, w = image.shape[:2]
    if max(h, w) <= max_dim:
        return image
    scale = max_dim / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
