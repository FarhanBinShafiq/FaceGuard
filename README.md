# 🔬 FaceRecog — AI Face Recognition System

A production-ready Face Recognition System with real-time webcam detection, user registration, identity verification, anti-spoofing, and fast embedding search — powered by InsightFace + FAISS.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Face Detection** | InsightFace buffalo_l model — state-of-the-art accuracy |
| **Face Recognition** | 512-dimensional ArcFace embeddings with cosine similarity |
| **Anti-Spoofing** | 4-layer liveness detection (texture, frequency, color, moiré) |
| **Fast Search** | FAISS IndexFlatIP for sub-millisecond similarity search |
| **Webcam Support** | Real-time face capture via browser MediaDevices API |
| **Image Upload** | Drag-and-drop upload with format validation |
| **User Management** | Full CRUD with face image storage |
| **REST API** | Clean FastAPI endpoints with auto-generated Swagger docs |
| **Configurable** | Threshold tuning, anti-spoof toggle, environment variables |
| **Scalable** | SQLite → PostgreSQL swap, Docker deployment ready |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│   │Dashboard │  │ Register │  │  Verify  │  │ Users  │ │
│   └─────┬────┘  └─────┬────┘  └─────┬────┘  └───┬────┘ │
│         └──────────────┴─────────────┴───────────┘      │
│                         │ HTTP                           │
└─────────────────────────┼────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   FastAPI Backend                        │
│   ┌──────────────────────────────────────────────────┐   │
│   │                  API Gateway                     │   │
│   │  POST /api/register  POST /api/verify            │   │
│   │  GET  /api/users     GET  /api/health            │   │
│   └──────────────┬───────────────────────────────────┘   │
│                  ▼                                       │
│   ┌────────────────────────────────────────────┐         │
│   │ Pipeline: Detect → Anti-Spoof → Embed → Search │    │
│   └─────┬────────────┬────────────┬──────┬─────┘        │
│         ▼            ▼            ▼      ▼              │
│   ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────┐       │
│   │InsightFace│ │AntiSpoof │ │ArcFace │ │ FAISS │       │
│   │ buffalo_l │ │ 4-layer  │ │ 512-d  │ │FlatIP │       │
│   └──────────┘ └──────────┘ └────────┘ └───────┘       │
│                                            │            │
│   ┌────────────────────────────────────────┐│            │
│   │  SQLite / PostgreSQL  │  File Storage  ││            │
│   └────────────────────────────────────────┘│            │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
facerecog/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── config.py             # Settings & environment vars
│   │   ├── database.py           # SQLAlchemy setup
│   │   ├── models.py             # ORM models
│   │   ├── schemas.py            # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── registration.py   # POST /api/register
│   │   │   ├── verification.py   # POST /api/verify
│   │   │   └── users.py          # User CRUD + health
│   │   ├── services/
│   │   │   ├── face_service.py   # InsightFace wrapper
│   │   │   ├── anti_spoof.py     # Liveness detection
│   │   │   └── embedding_store.py# FAISS index manager
│   │   └── utils/
│   │       └── image_utils.py    # Image encode/decode
│   ├── data/                     # Runtime data (auto-created)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── WebcamCapture.jsx
│   │   │   └── ImageUpload.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── VerifyPage.jsx
│   │   │   └── UsersPage.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Git**

### 1. Clone & Setup Backend

```bash
# Clone the repository
cd facerecog

# Create Python virtual environment
cd backend
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env
```

### 2. Start Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> On first run, InsightFace downloads the buffalo_l model (~300 MB). This only happens once.

**Backend is now running at:** `http://localhost:8000`
**Swagger API docs at:** `http://localhost:8000/docs`

### 3. Setup & Start Frontend

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

**Frontend is now running at:** `http://localhost:5173`

---

## 📡 API Reference

### Register User
```http
POST /api/register
Content-Type: multipart/form-data

name: "John Doe"
email: "john@example.com"  (optional)
image: <file>              (face image)
```

**Response (200):**
```json
{
  "success": true,
  "message": "User 'John Doe' registered successfully.",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "John Doe",
  "confidence": 0.8234
}
```

### Verify Face
```http
POST /api/verify
Content-Type: multipart/form-data

image: <file>   (face image)
```

**Response — Registered User (200):**
```json
{
  "status": "registered_user",
  "message": "Registered User: John Doe",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "John Doe",
  "confidence": 0.9156,
  "distance": 0.0844,
  "anti_spoof_score": 0.7892,
  "is_real_face": true
}
```

**Response — New User (200):**
```json
{
  "status": "new_user",
  "message": "New User — face not recognized in the database.",
  "confidence": 0.3421,
  "distance": 0.6579,
  "anti_spoof_score": 0.8012,
  "is_real_face": true
}
```

### List Users
```http
GET /api/users?skip=0&limit=100
```

### Delete User
```http
DELETE /api/users/{user_id}
```

### Health Check
```http
GET /api/health
```

### System Stats
```http
GET /api/stats
```

---

## ⚙️ Configuration

All settings configurable via environment variables or `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `SIMILARITY_THRESHOLD` | `0.45` | Cosine distance threshold (lower = stricter matching) |
| `FACE_DETECTION_CONFIDENCE` | `0.5` | Minimum face detection confidence |
| `ANTI_SPOOF_ENABLED` | `true` | Enable/disable anti-spoofing checks |
| `LBP_VARIANCE_THRESHOLD` | `30.0` | Texture analysis threshold |
| `DATABASE_URL` | `sqlite:///...` | Database connection string |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed frontend origins |

---

## 🛡️ Anti-Spoofing

The system uses 4 independent analysis layers:

1. **Texture Analysis (LBP)** — Real faces have richer micro-texture than printed photos
2. **Frequency Analysis (Laplacian)** — Detects blur and unnatural frequency patterns
3. **Color Space Analysis (YCrCb)** — Validates skin color falls within human range
4. **Moiré Detection (FFT)** — Detects periodic patterns from photographing screens

Combined weighted score > 0.5 = passes liveness check.

---

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔧 Switching to PostgreSQL

1. Install `psycopg2-binary`:
   ```bash
   pip install psycopg2-binary
   ```

2. Update `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/facerecog
   ```

3. Restart the backend. Tables are auto-created.

---

## 📊 Performance Notes

- **Embedding extraction:** ~50-100ms per face (CPU)
- **FAISS search:** <1ms for 10,000 embeddings (IndexFlatIP)
- **Anti-spoofing:** ~20ms per check
- **Total pipeline:** ~100-200ms per request

For production with >100K users, consider `IndexIVFFlat` or `IndexHNSW` for faster approximate search.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
#   F a c e G u a r d  
 