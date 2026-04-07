# FaceGuard Biometric SDK 🛡️

**FaceGuard** is a professional-grade biometric face recognition and verification SDK. It provides an easy-to-use interface for adding face authentication to your web applications, with built-in **Anti-Spoofing (Liveness Detection)** and premium UI components.

## Features
- ✅ **Face Detection & Alignment**: Powered by InsightFace.
- 🛡️ **Anti-Spoofing**: Prevents attacks using photos, screens, or printed images.
- ⚡ **High Performance**: FAISS-powered super-fast face matching (1M+ faces in milliseconds).
- ⚛️ **React Support**: Ready-to-use hooks and components.
- 🍦 **Vanilla JS Support**: Lightweight class-based implementation for any framework.
- 🎨 **Premium UI**: Cyber-lume theme with scanning animations.

---

## Installation

```bash
npm install @farhanbshafiq/faceguard-sdk
```

---

## Usage in React

### 1. Wrap your app with the Provider
```jsx
// Wrap your whole app with the Provider
import { FaceGuardProvider } from '@farhanbshafiq/faceguard-sdk';

function App() {
  return (
    // Replace with your FastAPI backend URL (e.g., http://localhost:8000/api)
    <FaceGuardProvider baseUrl="https://your-face-api.com/api">
      <YourAppComponent />
    </FaceGuardProvider>
  );
}
```

### 2. Use the Auth component
```jsx
import { FaceGuardAuth } from '@farhanbshafiq/faceguard-sdk';

const MyPage = () => {
  const handleSuccess = (user) => {
    console.log("Verified User:", user);
  };

  return (
    <FaceGuardAuth 
      mode="verify" 
      onSuccess={handleSuccess} 
      onError={(err) => alert(err.detail)} 
    />
  );
};
```

---

## Usage in Vanilla JS

You can mount the FaceGuard UI directly to any DOM element.

```javascript
import { VanillaFaceGuard } from '@farhanbshafiq/faceguard-sdk';

const fg = new VanillaFaceGuard({ baseUrl: '/api' });

// Mount to an element with ID 'camera-container'
fg.mount('camera-container');

// Listen for results
fg.onSuccess = (data) => {
  console.log("Success:", data);
};

fg.onError = (err) => {
  console.error("Failed:", err);
};
```

---

## Using the API Client (JS only)

If you want to build your own custom UI and only use our API client:

```javascript
import { FaceGuardClient } from '@farhanbshafiq/faceguard-sdk';

const client = new FaceGuardClient('/api');

// Example: Register with base64 image
const result = await client.registerUserBase64("John Doe", "john@example.com", base64Image);
```

---

## Backend Requirements
This SDK requires the **FaceGuard Backend** (FastAPI) to process biometric data. 
Ensure your backend is running and the `baseUrl` in the SDK points to it.

## License
MIT © [Farhan Bin Shafiq](https://github.com/FarhanBinShafiq)

## Repository
Built with ❤️ by [Farhan Bin Shafiq](https://github.com/FarhanBinShafiq). Check out the source on [GitHub](https://github.com/FarhanBinShafiq/FaceGuard).
