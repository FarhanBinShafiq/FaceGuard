"""
Anti-Spoofing Module.
Provides basic liveness detection to prevent photo/screen spoofing attacks.

Techniques used:
1. Texture Analysis (LBP Variance) — Real faces have richer micro-texture
2. Frequency Analysis (Laplacian) — Printed/screen photos have different frequency patterns
3. Color Space Analysis — Real skin has distinct color distribution in YCrCb
4. Reflection Detection — Screens often show specular reflections
"""

import logging
import cv2
import numpy as np
from typing import Tuple
from app.config import settings

logger = logging.getLogger(__name__)


class AntiSpoofService:
    """Basic anti-spoofing using texture and frequency analysis."""

    def __init__(self):
        self.lbp_scaler = settings.LBP_VARIANCE_SCALER
        self.laplacian_scaler = settings.LAPLACIAN_VAR_SCALER
        self.moire_threshold = settings.MOIRE_THRESHOLD

    def check_liveness(self, image: np.ndarray, face_bbox: list) -> Tuple[bool, float, dict]:
        """
        Perform liveness checks on a detected face region.

        Args:
            image: Full BGR image.
            face_bbox: [x1, y1, x2, y2] bounding box of the face.

        Returns:
            (is_real, overall_score, details_dict)
        """
        if not settings.ANTI_SPOOF_ENABLED:
            return True, 1.0, {"message": "Anti-spoofing disabled"}

        x1, y1, x2, y2 = [int(c) for c in face_bbox]
        h, w = image.shape[:2]

        # Clamp coordinates
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)

        if x2 - x1 < 30 or y2 - y1 < 30:
            return False, 0.0, {"error": "Face region too small for analysis"}

        face_region = image[y1:y2, x1:x2]

        scores = {}

        # ── 1. Texture Analysis (LBP Variance) ──
        texture_score = self._texture_analysis(face_region)
        scores["texture"] = round(texture_score, 4)

        # ── 2. Frequency Analysis (Laplacian) ──
        frequency_score = self._frequency_analysis(face_region)
        scores["frequency"] = round(frequency_score, 4)

        # ── 3. Color Space Analysis ──
        color_score = self._color_analysis(face_region)
        scores["color"] = round(color_score, 4)

        # ── 4. Moiré Pattern Detection ──
        moire_score = self._moire_detection(face_region)
        scores["moire"] = round(moire_score, 4)

        # ── Overall Score (weighted average) ──
        overall_score = (
            texture_score * 0.35 +
            frequency_score * 0.25 +
            color_score * 0.25 +
            moire_score * 0.15
        )
        scores["overall"] = round(overall_score, 4)

        is_real = overall_score > 0.5

        logger.info(f"Anti-spoof check: is_real={is_real}, score={overall_score:.4f}, details={scores}")

        return is_real, overall_score, scores

    def _texture_analysis(self, face_region: np.ndarray) -> float:
        """
        Analyze face texture using Local Binary Pattern (LBP) variance.
        Real faces have higher texture variance than printed photos or screens.
        """
        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (128, 128))

        # Compute simple LBP
        lbp = np.zeros_like(gray, dtype=np.uint8)
        for i in range(1, gray.shape[0] - 1):
            for j in range(1, gray.shape[1] - 1):
                center = gray[i, j]
                code = 0
                code |= (gray[i - 1, j - 1] >= center) << 7
                code |= (gray[i - 1, j] >= center) << 6
                code |= (gray[i - 1, j + 1] >= center) << 5
                code |= (gray[i, j + 1] >= center) << 4
                code |= (gray[i + 1, j + 1] >= center) << 3
                code |= (gray[i + 1, j] >= center) << 2
                code |= (gray[i + 1, j - 1] >= center) << 1
                code |= (gray[i, j - 1] >= center) << 0
                lbp[i, j] = code

        variance = float(np.var(lbp))

        # Normalize: higher variance → more likely real
        # Typical real face: variance > 1000, screen/photo: < 800
        score = min(1.0, variance / self.lbp_scaler)
        # Apply a slight boost for clearly real textures
        if score > 0.8:
            score = min(1.0, score * 1.1)
        return score

    def _frequency_analysis(self, face_region: np.ndarray) -> float:
        """
        Analyze frequency content using Laplacian variance.
        Real faces have natural frequency distribution; photos/screens may differ.
        """
        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (128, 128))

        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Very blurry images (laplacian_var < 20) are suspicious
        # Normal range: 50-500+
        if laplacian_var < 15:
            return 0.1
        elif laplacian_var > self.laplacian_scaler:
            return 1.0
        else:
            return min(1.0, laplacian_var / self.laplacian_scaler)

    def _color_analysis(self, face_region: np.ndarray) -> float:
        """
        Analyze color distribution in YCrCb space.
        Real skin has characteristic Cr/Cb ranges.
        """
        ycrcb = cv2.cvtColor(face_region, cv2.COLOR_BGR2YCrCb)

        cr = ycrcb[:, :, 1]
        cb = ycrcb[:, :, 2]

        cr_mean = np.mean(cr)
        cb_mean = np.mean(cb)
        cr_std = np.std(cr)
        cb_std = np.std(cb)

        # Human skin in YCrCb: Cr ∈ [133, 173], Cb ∈ [77, 127]
        # We use a fuzzy logic approach instead of hard binary
        cr_dist = 0
        if cr_mean < 133: cr_dist = 133 - cr_mean
        elif cr_mean > 173: cr_dist = cr_mean - 173

        cb_dist = 0
        if cb_mean < 77: cb_dist = 77 - cb_mean
        elif cb_mean > 127: cb_dist = cb_mean - 127

        # Total distance from "ideal" skin range
        total_dist = cr_dist + cb_dist
        
        # Base score starts at 0.7 if very close to range
        if total_dist < 5:
            score = 0.8
        elif total_dist < 15:
            score = 0.6
        else:
            score = 0.4

        if cr_std > 4 and cb_std > 4:  # Natural variation
            score += 0.2
        
        return max(0.0, min(1.0, score))

    def _moire_detection(self, face_region: np.ndarray) -> float:
        """
        Detect moiré patterns that appear when photographing screens.
        Uses FFT to find periodic artifacts.
        """
        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (128, 128)).astype(np.float32)

        # Compute 2D FFT
        f_transform = np.fft.fft2(gray)
        f_shift = np.fft.fftshift(f_transform)
        magnitude = np.abs(f_shift)

        # Analyze high-frequency energy ratio
        h, w = magnitude.shape
        center_h, center_w = h // 2, w // 2

        # Low frequency (center region)
        low_freq = magnitude[
            center_h - h // 4 : center_h + h // 4,
            center_w - w // 4 : center_w + w // 4,
        ]

        total_energy = np.sum(magnitude)
        low_energy = np.sum(low_freq)

        if total_energy == 0:
            return 0.5

        # High frequency ratio
        high_freq_ratio = 1 - (low_energy / total_energy)

        # Moderate high frequency → natural (0.3-0.6)
        # Very high → suspicious moiré patterns
        if high_freq_ratio > self.moire_threshold:
            return 0.2  # Likely screen capture with moiré
        elif high_freq_ratio > 0.35:
            return 1.0  # Perfect range for natural faces
        else:
            return 0.7  # Low detail, possibly blurry photo but not definitely spoof


# Module-level singleton
_anti_spoof_service = None


def get_anti_spoof_service() -> AntiSpoofService:
    """Get the singleton AntiSpoofService instance."""
    global _anti_spoof_service
    if _anti_spoof_service is None:
        _anti_spoof_service = AntiSpoofService()
    return _anti_spoof_service
