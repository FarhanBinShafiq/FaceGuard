"""
FAISS-based Embedding Store.
Manages the FAISS index for fast similarity search of face embeddings.
Provides persistence (save/load) and maps FAISS indices to user IDs.
"""

import json
import logging
import numpy as np
import faiss
from typing import Optional, Tuple, List
from pathlib import Path
from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingStore:
    """FAISS index manager for face embedding similarity search."""

    _instance: Optional["EmbeddingStore"] = None
    _initialized: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        self.dim = settings.EMBEDDING_DIM
        self.index_path = str(settings.FAISS_INDEX_PATH)
        self.user_map_path = str(settings.USER_MAP_PATH)
        self.threshold = settings.SIMILARITY_THRESHOLD

        # user_map: FAISS index position → user_id
        self.user_map: dict[int, str] = {}

        # Initialize or load FAISS index
        self._load_or_create()

    def _load_or_create(self):
        """Load existing FAISS index or create a new one."""
        if Path(self.index_path).exists() and Path(self.user_map_path).exists():
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.user_map_path, "r") as f:
                    raw = json.load(f)
                    self.user_map = {int(k): v for k, v in raw.items()}
                logger.info(f"Loaded FAISS index with {self.index.ntotal} embeddings.")
            except Exception as e:
                logger.warning(f"Failed to load FAISS index: {e}. Creating new.")
                self._create_new_index()
        else:
            self._create_new_index()

    def _create_new_index(self):
        """Create a new FAISS index (Inner Product for cosine similarity on normalized vectors)."""
        self.index = faiss.IndexFlatIP(self.dim)
        self.user_map = {}
        logger.info(f"Created new FAISS index (dim={self.dim}).")

    def add_embedding(self, user_id: str, embedding: np.ndarray) -> int:
        """
        Add a face embedding to the index.

        Args:
            user_id: Unique user identifier.
            embedding: Normalized 512-d float32 vector.

        Returns:
            Index position of the added embedding.
        """
        embedding = embedding.reshape(1, -1).astype(np.float32)

        # Ensure normalized
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        position = self.index.ntotal
        self.index.add(embedding)
        self.user_map[position] = user_id

        self._save()
        logger.info(f"Added embedding for user {user_id} at position {position}.")
        return position

    def search(self, embedding: np.ndarray, top_k: int = 5) -> List[Tuple[str, float]]:
        """
        Search for the most similar embeddings.

        Args:
            embedding: Query embedding (normalized 512-d float32).
            top_k: Number of results to return.

        Returns:
            List of (user_id, similarity_score) tuples, sorted by similarity desc.
        """
        if self.index.ntotal == 0:
            return []

        embedding = embedding.reshape(1, -1).astype(np.float32)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        k = min(top_k, self.index.ntotal)
        similarities, indices = self.index.search(embedding, k)

        results = []
        for sim, idx in zip(similarities[0], indices[0]):
            if idx == -1:
                continue
            user_id = self.user_map.get(int(idx))
            if user_id:
                results.append((user_id, float(sim)))

        return results

    def find_match(self, embedding: np.ndarray) -> Tuple[Optional[str], float]:
        """
        Find the best matching user for an embedding.

        Args:
            embedding: Query embedding.

        Returns:
            (user_id, similarity) if match found above threshold, else (None, best_similarity).
        """
        results = self.search(embedding, top_k=1)

        if not results:
            return None, 0.0

        user_id, similarity = results[0]

        # For cosine similarity (inner product on normalized vectors):
        # similarity ranges from -1 to 1, where 1 = identical
        # Convert to distance: distance = 1 - similarity
        distance = 1.0 - similarity

        if distance < self.threshold:
            return user_id, similarity
        else:
            return None, similarity

    def remove_user(self, user_id: str) -> bool:
        """
        Remove all embeddings for a user by rebuilding the index.
        FAISS doesn't support deletion, so we rebuild.
        """
        positions_to_keep = []
        new_user_map = {}

        for pos, uid in sorted(self.user_map.items()):
            if uid != user_id:
                positions_to_keep.append(pos)

        if len(positions_to_keep) == len(self.user_map):
            return False  # User not found

        # Rebuild index
        if positions_to_keep:
            embeddings = []
            for pos in positions_to_keep:
                vec = self.index.reconstruct(pos)
                embeddings.append(vec)

            new_index = faiss.IndexFlatIP(self.dim)
            all_vecs = np.array(embeddings, dtype=np.float32)
            new_index.add(all_vecs)

            for new_pos, old_pos in enumerate(positions_to_keep):
                new_user_map[new_pos] = self.user_map[old_pos]

            self.index = new_index
            self.user_map = new_user_map
        else:
            self._create_new_index()

        self._save()
        logger.info(f"Removed user {user_id} from FAISS index. New size: {self.index.ntotal}")
        return True

    def check_duplicate(self, embedding: np.ndarray) -> Tuple[bool, Optional[str], float]:
        """
        Check if an embedding already exists (for preventing duplicate registrations).

        Returns:
            (is_duplicate, user_id, similarity)
        """
        results = self.search(embedding, top_k=1)
        if not results:
            return False, None, 0.0

        user_id, similarity = results[0]
        distance = 1.0 - similarity

        # Use a stricter threshold for duplicate detection
        is_duplicate = distance < self.threshold
        return is_duplicate, user_id if is_duplicate else None, similarity

    @property
    def total(self) -> int:
        """Total number of embeddings in the index."""
        return self.index.ntotal

    def _save(self):
        """Persist the FAISS index and user map to disk."""
        try:
            faiss.write_index(self.index, self.index_path)
            with open(self.user_map_path, "w") as f:
                json.dump({str(k): v for k, v in self.user_map.items()}, f)
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")


# Module-level singleton accessor
def get_embedding_store() -> EmbeddingStore:
    """Get the singleton EmbeddingStore instance."""
    return EmbeddingStore()
