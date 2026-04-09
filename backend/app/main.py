"""
Face Recognition System — FastAPI Application Entry Point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers import registration, verification, users, analytics, audits

# ── Logging ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)-25s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup/shutdown) ──────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize DB and models on startup."""
    logger.info("=" * 60)
    logger.info(f"  {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("=" * 60)

    # Initialize database
    init_db()
    logger.info("Database initialized.")

    # Pre-load models (warm up)
    logger.info("Loading face recognition models...")
    from app.services.face_service import get_face_service
    from app.services.embedding_store import get_embedding_store

    get_face_service()
    get_embedding_store()
    logger.info("All models loaded. Server ready.")

    yield

    logger.info("Shutting down...")


# ── FastAPI App ──────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-ready Face Recognition System with face detection, "
        "anti-spoofing, embedding extraction, and fast similarity search."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (serve face images) ────────────────────
app.mount("/images", StaticFiles(directory=str(settings.IMAGES_DIR)), name="images")

# ── Routers ──────────────────────────────────────────────
app.include_router(registration.router)
app.include_router(verification.router)
app.include_router(users.router)
app.include_router(analytics.router)
app.include_router(audits.router)


# ── Root ─────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
