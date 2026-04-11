# 🛡️ FaceGuard — Ultimate Enterprise AI Face Recognition & Analytics

FaceGuard is a state-of-the-art, production-ready AI Security Platform. It combines industry-leading face detection, deep learning-based biometric extraction, and multi-layered anti-spoofing into a high-performance, aesthetically stunning solution.

Whether it's securing an enterprise vault, monitoring supermarket crowd demographics, or managing employee access with detailed audit logs, FaceGuard is built to scale.

---

## ✨ Core Modules

### 🔐 1. Enterprise Security (Pro)
*   **Audit Logging:** Automatic snapshots and detailed logs for every verification attempt.
*   **User Roles:** Granular access control (VIP, Staff, Customer, Blacklisted).
*   **Smart Alerts:** Real-time visual and voice alerts for Blacklisted individuals.
*   **Biometric Vault:** Secure personal storage accessible only via face authentication.
*   **Voice Analytics:** Real-time AI voice feedback for success/failure events.

### 📊 2. Supermarket & Crowd Analytics
*   **Multi-Face Analysis:** Detect and analyze entire crowds in a single frame.
*   **Demographics:** Real-time Age and Gender estimation.
*   **Mood Analysis:** Real-time Emotion Detection (Happy, Neutral, Serious, Surprised).
*   **Body Metrics & Pose:** Heuristic-based height estimation, shoulder width analysis, and 3D head pose tracking.
*   **VIP Identification:** Automatically flag registered customers in live crowd streams.

### 🛡️ 3. Multi-Layer Anti-Spoofing
*   **Texture Analysis:** LBP Variance check to distinguish human skin from printed ink.
*   **Frequency Analysis:** Laplacian variance to detect screen refresh artifacts and blur-based spoofing.
*   **Moiré Pattern Detection:** FFT-based periodic artifact detection for high-res screen attacks.
*   **Color-Space Analysis:** Validates skin-tone distributions in specialized YCrCb space.

---

## 🔧 Configuration & Tuning

FaceGuard is highly configurable via the `backend/.env` file. Proper tuning of these values ensures the best balance between security and UX:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `SIMILARITY_THRESHOLD` | `0.55` | Cosine distance threshold. Lower is stricter. `0.55` is recommended for general use. |
| `ANTI_SPOOF_ENABLED` | `true` | Toggle the 4-layer liveness detection system. |
| `LBP_VARIANCE_THRESHOLD`| `30.0` | Sensitivity for texture analysis. |
| `LAPLACIAN_THRESHOLD` | `50.0` | Sensitivity for frequency/blur detection. |

---

## 🛠️ Technology Stack

### **Backend (Python)**
*   **[FastAPI](https://fastapi.tiangolo.com/):** High-performance web framework.
*   **[InsightFace](https://github.com/deepinsight/insightface):** 2D/3D face analysis (buffalo_l model).
*   **[FAISS](https://github.com/facebookresearch/faiss):** Sub-millisecond vector similarity search.
*   **[OpenCV](https://opencv.org/):** Real-time image processing & analytics.
*   **[SQLAlchemy](https://www.sqlalchemy.org/):** Robust ORM with SQLite/PostgreSQL support.

### **Frontend (Vite + React)**
*   **[React 19](https://react.dev/):** Modern UI architecture.
*   **[Lucide React](https://lucide.dev/):** Premium icon set.
*   **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API):** AI Voice Synthesis feedback.
*   **Industrial Aesthetics:** Custom CSS design system with Glassmorphism and Neon Accents.

---

## 🚀 Getting Started

### **1. Setup Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### **2. Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Architecture

| Category | Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | `POST /api/register` | Secure biometric enrollment with role assignment. |
| **Auth** | `POST /api/verify` | 1:N recognition with 4-layer liveness check. |
| **Analytics** | `POST /api/analytics/crowd` | Advanced demographics & body metrics extraction. |
| **Enterprise** | `GET /api/audits` | Retrieve detailed event logs with success snapshots. |
| **System** | `GET /api/health` | Real-time performance and index status. |

---

## 🐳 Docker Support
Deploy the entire infrastructure in one click:
```bash
docker-compose up --build -d
```

---

## 📄 License & Author
Distributed under the **MIT License**.

Built for excellence by **[Farhan Bin Shafiq](https://github.com/FarhanBinShafiq)**.