# 🛡️ FaceGuard — Enterprise AI Face Recognition & Liveness Detection

FaceGuard is a state-of-the-art, production-ready Face Recognition System. It combines high-accuracy face detection, deep learning-based embedding extraction, and multi-layered anti-spoofing (liveness detection) into a seamless, high-performance solution. 

Powered by **InsightFace** for computer vision and **FAISS** for lightning-fast vector similarity search.

---

## 🛠️ Technology Stack

### **Backend (Python)**
*   **[FastAPI](https://fastapi.tiangolo.com/):** High-performance web framework for building APIs.
*   **[InsightFace](https://github.com/deepinsight/insightface):** 2D and 3D face analysis library (using `buffalo_l` model).
*   **[FAISS](https://github.com/facebookresearch/faiss):** Library for efficient similarity search and clustering of dense vectors.
*   **[ONNX Runtime](https://onnxruntime.ai/):** High-performance inference engine for ML models.
*   **[SQLAlchemy](https://www.sqlalchemy.org/):** Modern Python SQL Toolkit and Object Relational Mapper.
*   **[OpenCV](https://opencv.org/):** Real-time computer vision and image processing.

### **Frontend (JavaScript/React)**
*   **[React 19](https://react.dev/):** The latest version of the popular UI library.
*   **[Vite](https://vitejs.dev/):** Next-generation frontend tooling for fast development.
*   **[Lucide React](https://lucide.dev/):** Beautifully simple, pixel-perfect icon toolkit.
*   **[React Webcam](https://www.npmjs.com/package/react-webcam):** Real-time webcam stream integration.
*   **Vanilla CSS:** Custom-crafted, premium design system with dark mode and glassmorphism.

---

## 🚀 Getting Started (কিভাবে রান করবেন)

### **Prerequisites**
*   **Python 3.10+** (Backend-এর জন্য)
*   **Node.js 18+** (Frontend-এর জন্য)
*   **Git**

---

### **1. Setup Backend (ব্যাকএন্ড সেটআপ)**

```bash
# Clone the repository
git clone https://github.com/FarhanBinShafiq/FaceGuard.git
cd FaceGuard/backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
```

**Run Backend:**
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> **Note:** প্রথমবার রান করার সময় InsightFace মডেল ডাউনলোড করবে (~300MB)। এতে কিছুটা সময় লাগতে পারে।

---

### **2. Setup Frontend (ফ্রন্টএন্ড সেটআপ)**

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
**Access Application:** `http://localhost:5173`

---

## 🔍 How It Works (কিভাবে এটি কাজ করে)

FaceGuard follows a sophisticated 4-step pipeline for every request:

1.  **Face Detection:** InsightFace scans the uploaded image or webcam frame using the `buffalo_l` detector to find all faces and their landmarks.
2.  **Liveness Detection (Anti-Spoofing):** To prevent photo or screen-based attacks, the system runs 4 concurrent checks:
    *   **Texture Analysis:** Checks for micro-texture details unique to human skin.
    *   **Frequency Analysis:** Detects artificial blur or printer-related artifacts.
    *   **Color Range Check:** Validates if pixel distributions match real skin in YCrCb space.
    *   **Moiré Pattern Detection:** Uses FFT (Fast Fourier Transform) to find screen-refresh artifacts.
3.  **Embedding Extraction:** The face is normalized and passed through the `ArcFace` model to generate a unique **512-dimensional vector** (face signature).
4.  **Vector Search:** The vector is compared against thousands of registered users in the **FAISS index** using Cosine Similarity in sub-millisecond time.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/register` | Register a new user with name and face image. |
| `POST` | `/api/verify` | Identify an unknown face and check liveness. |
| `GET` | `/api/users` | List all registered users in the system. |
| `DELETE` | `/api/users/{id}` | Permanently delete a user and their face data. |
| `GET` | `/api/health` | Check system and database status. |

---

## ⚙️ Configuration

Environment variables in `backend/.env` allow you to tune the system:
*   `SIMILARITY_THRESHOLD`: Adjust matching sensitivity (Default: `0.45`).
*   `ANTI_SPOOF_ENABLED`: Toggle liveness check (Default: `true`).
*   `DATABASE_URL`: Switch between SQLite and PostgreSQL.

---

## 🐳 Docker Support

Deploy the entire stack with a single command:
```bash
docker-compose up --build -d
```

---

## 📄 License
Distributed under the **MIT License**.

Built with ❤️ by [Farhan Bin Shafiq](https://github.com/FarhanBinShafiq)