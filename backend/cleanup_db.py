import os
import shutil
import sqlite3
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
IMAGES_DIR = DATA_DIR / "images"
DB_PATH = DATA_DIR / "facerecog.db"
FAISS_PATH = DATA_DIR / "faiss_index.bin"
USER_MAP_PATH = DATA_DIR / "user_map.json"

def cleanup():
    print("🧹 Cleaning up FaceGuard database...")

    # 1. Clear SQL Database
    if DB_PATH.exists():
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM users")
            conn.commit()
            conn.close()
            print("✅ SQLite 'users' table cleared.")
        except Exception as e:
            print(f"❌ Failed to clear SQLite DB: {e}")
    
    # 2. Delete FAISS Index and User Map
    if FAISS_PATH.exists():
        os.remove(FAISS_PATH)
        print("✅ FAISS index deleted.")
    
    if USER_MAP_PATH.exists():
        os.remove(USER_MAP_PATH)
        print("✅ User map JSON deleted.")

    # 3. Clear Images Directory (keep .gitkeep if exists)
    if IMAGES_DIR.exists():
        for filename in os.listdir(IMAGES_DIR):
            file_path = IMAGES_DIR / filename
            if filename != '.gitkeep' and os.path.isfile(file_path):
                os.remove(file_path)
        print("✅ Face images directory cleared.")

    print("\n✨ Database and biometric data cleared successfully.")

if __name__ == "__main__":
    cleanup()
