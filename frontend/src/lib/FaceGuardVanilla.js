import { FaceGuardClient } from './api';

/**
 * Vanilla JS SDK for FaceGuard
 */
export class FaceGuard {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '/api';
    this.client = new FaceGuardClient(this.baseUrl);
    this.container = null;
    this.video = null;
    this.canvas = null;
    this.isProcessing = false;
  }

  /**
   * Initialize and mount the face capture UI to a DOM element.
   */
  async mount(elementId) {
    this.container = document.getElementById(elementId);
    if (!this.container) throw new Error(`Element #${elementId} not found`);

    this.container.innerHTML = `
      <div class="face-guard-sdk-wrapper" style="position: relative; max-width: 480px; margin: 0 auto;">
        <div id="fg-webcam-container" class="webcam-container active" style="aspect-ratio: 4/3; background: #000; position: relative; overflow: hidden; border-radius: 12px; border: 2px solid #06d6a0;">
          <video id="fg-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
          <div class="face-guide" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none;">
            <div class="face-guide-circle" style="width: 55%; aspect-ratio: 3/4; border: 2px dashed rgba(6, 214, 160, 0.4); border-radius: 50%;"></div>
          </div>
          <div id="fg-scan-line" class="webcam-scan-line" style="display: none;"></div>
          <div id="fg-overlay" style="display: none; position: absolute; inset: 0; background: rgba(0,0,0,0.7); flex-direction: column; align-items: center; justify-content: center; color: #fff; text-align: center; padding: 20px;"></div>
        </div>
        <div style="margin-top: 15px; display: flex; gap: 10px;">
          <button id="fg-capture-btn" class="btn btn-primary" style="flex: 1; padding: 12px; border-radius: 8px; cursor: pointer; border: none; font-weight: bold;">Capture & Verify</button>
          <button id="fg-toggle-btn" class="btn btn-secondary" style="padding: 12px; border-radius: 8px; cursor: pointer; border: 1px solid #ccc;">Switch</button>
        </div>
      </div>
    `;

    this.video = document.getElementById('fg-video');
    this.scanLine = document.getElementById('fg-scan-line');
    this.overlay = document.getElementById('fg-overlay');
    this.captureBtn = document.getElementById('fg-capture-btn');
    this.toggleBtn = document.getElementById('fg-toggle-btn');

    this.captureBtn.onclick = () => this.capture();
    this.toggleBtn.onclick = () => this.toggleFacingMode();

    await this.startStream();
  }

  async startStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facingMode || 'user' },
        audio: false
      });
      this.video.srcObject = stream;
    } catch (err) {
      this.showError("Camera access denied: " + err.message);
    }
  }

  toggleFacingMode() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    this.startStream();
  }

  async capture() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.scanLine.style.display = 'block';
    this.captureBtn.disabled = true;
    this.captureBtn.innerText = "Analyzing...";

    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    canvas.getContext('2d').drawImage(this.video, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg', 0.9);

    try {
      const result = await this.client.verifyFaceBase64(base64Image);
      this.showSuccess(result.message);
      if (this.onSuccess) this.onSuccess(result);
    } catch (err) {
      this.showError(err.detail || err.message);
      if (this.onError) this.onError(err);
    } finally {
      this.isProcessing = false;
      this.scanLine.style.display = 'none';
      this.captureBtn.disabled = false;
      this.captureBtn.innerText = "Capture & Verify";
    }
  }

  showSuccess(msg) {
    this.overlay.style.display = 'flex';
    this.overlay.innerHTML = `<h3 style="color: #06d6a0;">Check Success</h3><p>${msg}</p><button onclick="location.reload()" style="margin-top: 10px; cursor: pointer;">Reset</button>`;
  }

  showError(msg) {
    this.overlay.style.display = 'flex';
    this.overlay.innerHTML = `<h3 style="color: #ef476f;">Error</h3><p>${msg}</p><button onclick="document.getElementById('fg-overlay').style.display='none'" style="margin-top: 10px; cursor: pointer;">Dismiss</button>`;
  }
}
