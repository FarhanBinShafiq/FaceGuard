"""
Configuration management for the Face Recognition System.
Uses environment variables with sensible defaults.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "Face Recognition System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ── Paths ────────────────────────────────────────────
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    IMAGES_DIR: Path = DATA_DIR / "images"
    FAISS_INDEX_PATH: Path = DATA_DIR / "faiss_index.bin"
    USER_MAP_PATH: Path = DATA_DIR / "user_map.json"

    # ── Database ─────────────────────────────────────────
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'facerecog.db'}"

    # ── Face Recognition ─────────────────────────────────
    SIMILARITY_THRESHOLD: float = 0.55  # cosine distance threshold (lower = stricter)
    FACE_DETECTION_CONFIDENCE: float = 0.5
    EMBEDDING_DIM: int = 512
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS: set = {"jpg", "jpeg", "png", "webp", "bmp"}

    # ── Anti-Spoofing ────────────────────────────────────
    ANTI_SPOOF_ENABLED: bool = True
    LBP_VARIANCE_SCALER: float = 2000.0  # Divisor for texture variance (lower = higher score)
    LAPLACIAN_VAR_SCALER: float = 300.0   # Divisor for blur variance (lower = higher score)
    MOIRE_THRESHOLD: float = 0.7          # FFT high-freq energy threshold
    LBP_VARIANCE_THRESHOLD: float = 30.0  # Added to match .env
    LAPLACIAN_THRESHOLD: float = 50.0      # Added to match .env

    # ── Security ─────────────────────────────────────────
    API_KEY: str = ""  # Set via env var for production
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://192.168.0.169:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.IMAGES_DIR.mkdir(parents=True, exist_ok=True)
