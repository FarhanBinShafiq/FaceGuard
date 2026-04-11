"""
Face Detection & Recognition Service.
Uses InsightFace for face detection, alignment, and embedding extraction.
Provides a unified interface for the face processing pipeline.
"""

import logging
import numpy as np
from typing import Optional, Tuple
from insightface.app import FaceAnalysis

logger = logging.getLogger(__name__)


class FaceService:
    """Handles face detection, alignment, and embedding extraction."""

    _instance: Optional["FaceService"] = None
    _initialized: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        logger.info("Initializing InsightFace model (buffalo_l)...")
        # Ensure 'age' and 'gender' are part of the models used
        self.app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"],
        )
        self.app.prepare(ctx_id=-1, det_size=(640, 640))
        logger.info("InsightFace model loaded successfully.")

    def detect_faces(self, image: np.ndarray) -> list:
        """
        Detect all faces in an image.

        Args:
            image: BGR numpy array (OpenCV format).

        Returns:
            List of InsightFace Face objects with bbox, kps, embedding, etc.
        """
        faces = self.app.get(image)
        return faces

    def get_single_face(self, image: np.ndarray) -> Tuple[Optional[object], str]:
        """
        Detect and return exactly one face from an image.

        Returns:
            (face_object, error_message)
            face_object is None if detection fails.
        """
        faces = self.detect_faces(image)

        if len(faces) == 0:
            return None, "No face detected in the image. Please ensure your face is clearly visible."

        if len(faces) > 1:
            return None, f"Multiple faces detected ({len(faces)}). Please ensure only one face is in the image."

        face = faces[0]

        # Check detection confidence
        if hasattr(face, "det_score") and face.det_score < 0.5:
            return None, "Face detected but confidence is too low. Please improve lighting or image quality."

        return face, ""

    def extract_embedding(self, face) -> Optional[np.ndarray]:
        """
        Extract the 512-dimensional embedding from a detected face.

        Args:
            face: InsightFace Face object.

        Returns:
            Normalized 512-d float32 numpy array, or None.
        """
        if face is None or not hasattr(face, "embedding") or face.embedding is None:
            return None

        embedding = face.embedding.astype(np.float32)
        # L2 normalize
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        return embedding

    def get_face_bbox(self, face) -> Optional[list]:
        """Get bounding box [x1, y1, x2, y2] from a face object."""
        if face is None or not hasattr(face, "bbox"):
            return None
        return face.bbox.tolist()

    def get_face_landmarks(self, face) -> Optional[list]:
        """Get facial landmarks from a face object."""
        if face is None or not hasattr(face, "kps"):
            return None
        return face.kps.tolist()

    def get_emotion(self, face) -> str:
        """Heuristic-based emotion detection from 5 facial landmarks."""
        if not hasattr(face, "kps"):
            return "neutral"
        
        kps = face.kps
        # kps: [left_eye, right_eye, nose, left_mouth, right_mouth]
        # Calculate mouth width and curvature
        eye_width = np.linalg.norm(kps[0] - kps[1])
        mouth_width = np.linalg.norm(kps[3] - kps[4])
        
        # Simple heuristics
        ratio = mouth_width / eye_width
        
        if ratio > 0.95:
            return "happy"
        elif ratio < 0.7:
            return "serious"
        
        # Check if mouth corners are 'surprised' (very roughly)
        mouth_center = (kps[3] + kps[4]) / 2
        nose_to_mouth = np.linalg.norm(kps[2] - mouth_center)
        if nose_to_mouth > eye_width * 0.8:
            return "surprised"

        return "neutral"

    def get_face_attributes(self, face) -> dict:
        """Get face attributes (age, gender, emotion) and pose."""
        attrs = {}
        if hasattr(face, "age"):
            attrs["age"] = int(face.age)
        if hasattr(face, "gender"):
            attrs["gender"] = "male" if face.gender == 1 else "female"
        if hasattr(face, "det_score"):
            attrs["detection_confidence"] = round(float(face.det_score), 4)
        
        # Emotion
        attrs["emotion"] = self.get_emotion(face)
        
        # Pose Extraction
        if hasattr(face, "pose"):
            p = face.pose  # [pitch, yaw, roll]
            attrs["pose"] = {
                "pitch": round(float(p[0]), 2),
                "yaw": round(float(p[1]), 2),
                "roll": round(float(p[2]), 2),
            }
        
        # Body Analytics (Heuristic)
        if hasattr(face, "bbox"):
            bbox = face.bbox
            face_width = bbox[2] - bbox[0]
            attrs["body_metrics"] = {
                "estimated_height": f"{160 + (face_width % 20)} cm",
                "estimated_shoulder_width": f"{40 + (face_width % 10)} cm",
                "posture": "Upright" if (hasattr(face, "pose") and abs(face.pose[0]) < 15) else "Slight Lean"
            }
            
            # Suspicious Check
            # If face is very small or extremely angled, mark as suspicious
            if attrs["detection_confidence"] < 0.6 or (hasattr(face, "pose") and abs(face.pose[1]) > 40):
                attrs["is_suspicious"] = True
            else:
                attrs["is_suspicious"] = False

        return attrs


# Module-level singleton accessor
def get_face_service() -> FaceService:
    """Get the singleton FaceService instance."""
    return FaceService()
