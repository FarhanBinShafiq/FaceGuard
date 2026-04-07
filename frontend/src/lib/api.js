/**
 * FaceGuard SDK — API Client
 * Lightweight client for interacting with the FaceGuard backend.
 */

export class FaceGuardClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async registerUser(name, email, imageBlob) {
    const formData = new FormData();
    formData.append("name", name);
    if (email) formData.append("email", email);
    formData.append("image", imageBlob, "face.jpg");

    const res = await fetch(`${this.baseUrl}/register`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      let error;
      try {
        error = JSON.parse(text);
      } catch (e) {
        throw { status: res.status, detail: `Server error (${res.status}): ${text.substring(0, 50)}...` };
      }
      throw { status: res.status, ...error };
    }

    return await res.json();
  }

  async registerUserBase64(name, email, base64Image) {
    const formData = new FormData();
    formData.append("name", name);
    if (email) formData.append("email", email);
    formData.append("image_base64", base64Image);

    const res = await fetch(`${this.baseUrl}/register`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        throw { status: res.status, detail: `Biometric server error (${res.status})` };
      }
      throw { status: res.status, ...errorData };
    }

    return await res.json();

  }

  async verifyFace(imageBlob) {
    const formData = new FormData();
    formData.append("image", imageBlob, "face.jpg");

    const res = await fetch(`${this.baseUrl}/verify`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        throw { status: res.status, detail: "Fingerprint/Face analysis failed." };
      }
      throw { status: res.status, ...errorData };
    }

    return await res.json();

  }

  async verifyFaceBase64(base64Image) {
    const formData = new FormData();
    formData.append("image_base64", base64Image);

    const res = await fetch(`${this.baseUrl}/verify`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        throw { status: res.status, detail: "Biometric analysis server error" };
      }
      throw { status: res.status, ...errorData };
    }

    return await res.json();

  }

  async getHealth() {
    const res = await fetch(`${this.baseUrl}/health`);
    return await res.json();
  }
}
