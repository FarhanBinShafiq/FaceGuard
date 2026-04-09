/**
 * API Client for the Face Recognition System backend.
 */

const API_BASE = "/api";

/**
 * Register a new user with a face image.
 * @param {string} name - User's name
 * @param {string} email - User's email (optional)
 * @param {Blob|File} imageBlob - Face image blob
 * @returns {Promise<object>}
 */
export async function registerUser(name, email, imageBlob) {
  const formData = new FormData();
  formData.append("name", name);
  if (email) formData.append("email", email);
  formData.append("image", imageBlob, "face.jpg");

  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/**
 * Register a user using a base64 image (from webcam).
 */
export async function registerUserBase64(name, email, base64Image) {
  const formData = new FormData();
  formData.append("name", name);
  if (email) formData.append("email", email);
  formData.append("image_base64", base64Image);

  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/**
 * Verify a face against the database.
 * @param {Blob|File} imageBlob - Face image blob
 * @returns {Promise<object>}
 */
export async function verifyFace(imageBlob) {
  const formData = new FormData();
  formData.append("image", imageBlob, "face.jpg");

  const res = await fetch(`${API_BASE}/verify`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/**
 * Verify face using base64 image (from webcam).
 */
export async function verifyFaceBase64(base64Image) {
  const formData = new FormData();
  formData.append("image_base64", base64Image);

  const res = await fetch(`${API_BASE}/verify`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/**
 * Get list of registered users.
 */
export async function getUsers() {
  const res = await fetch(`${API_BASE}/users`);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/**
 * Get a specific user's details.
 */
export async function getUser(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}`);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/**
 * Delete a user.
 */
export async function deleteUser(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/**
 * Get system health.
 */
export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/**
 * Get system stats.
 */
export async function getStats() {
  const res = await fetch(`${API_BASE}/stats`);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/**
 * Perform crowd analysis (multi-face + attributes) from webcam.
 */
export async function analyzeCrowdBase64(base64Image) {
  const formData = new FormData();
  formData.append("image_base64", base64Image);

  const res = await fetch(`${API_BASE}/analytics/crowd`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

/**
 * Get user's face image URL.
 */
export function getUserImageUrl(userId) {
  return `${API_BASE}/users/${userId}/image`;
}
