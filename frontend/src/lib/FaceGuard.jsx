import React, { useState, useCallback, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, CameraOff, RefreshCw, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useFaceGuard } from './FaceGuardContext';

/**
 * High-level component for Face Authentication.
 * Handles capture and verification automatically.
 * @param {string} mode - 'verify' or 'register'
 * @param {Function} onSuccess - Callback when verification/registration succeeds
 * @param {Function} onError - Callback when an error occurs
 */
export const FaceGuardAuth = ({ mode = 'verify', onSuccess, onError, config = {} }) => {
  const { client } = useFaceGuard();
  const webcamRef = useRef(null);
  const [isOn, setIsOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [status, setStatus] = useState('idle'); // idle | capture | processing | success | error
  const [message, setMessage] = useState('');

  const captureAndProcess = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageBase64 = webcamRef.current.getScreenshot();
    if (!imageBase64) return;

    setIsProcessing(true);
    setStatus('processing');
    setMessage('Processing biometric data...');

    try {
      let result;
      if (mode === 'verify') {
        result = await client.verifyFaceBase64(imageBase64);
      } else {
        // For registration, typically you'd need a name/email, 
        // so this 'register' mode here might just be the capture part or a simplified version
        result = await client.registerUserBase64(config.name || 'Anonymous', config.email || null, imageBase64);
      }

      setStatus('success');
      setMessage(result.message || 'Authentication successful');
      onSuccess?.(result);

      // Auto turn off camera on success
      setTimeout(() => setIsOn(false), 2000);
    } catch (err) {
      setStatus('error');
      setMessage(err.detail || err.message || 'Authentication failed');
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  }, [client, mode, config, onSuccess, onError]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const reset = () => {
    setStatus('idle');
    setMessage('');
    setIsProcessing(false);
  };

  if (!isOn) {
    return (
      <div className="face-guard-sdk-container card-glass text-center p-xl">
        <ShieldCheck size={48} className="text-primary mb-md mx-auto" />
        <h3 className="mb-sm">Face Authentication</h3>
        <p className="text-muted mb-lg">Secure your session with biometric face recognition.</p>
        <button className="btn btn-primary btn-lg w-full" onClick={() => { setIsOn(true); reset(); }}>
          <Camera size={18} />
          Start Authentication
        </button>
      </div>
    );
  }

  return (
    <div className="face-guard-sdk-wrapper">
      <div className={`webcam-container active ${status === 'success' ? 'border-success' : status === 'error' ? 'border-danger' : ''}`}>
        {status === 'success' ? (
          <div className="flex-center h-full w-full bg-overlay">
            <div className="text-center animate-bounce">
              <ShieldCheck size={64} className="text-success" />
              <p className="mt-md font-bold text-success text-xl">{message}</p>
            </div>
          </div>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode }}
              mirrored={facingMode === 'user'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            
            {/* Guide & HUD */}
            <div className="face-guide">
              <div className="face-guide-circle" style={{ borderColor: status === 'error' ? 'var(--color-danger)' : '' }} />
            </div>
            {status === 'processing' && <div className="webcam-scan-line" />}
            
            {status === 'error' && (
              <div className="absolute inset-0 bg-overlay flex items-center justify-center p-md">
                <div className="text-center">
                  <ShieldAlert size={48} className="text-danger mx-auto mb-sm" />
                  <p className="text-danger font-bold text-lg mb-md">{message}</p>
                  <button className="btn btn-secondary btn-sm" onClick={reset}>Try Again</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-md flex gap-md">
        <button 
          className="btn btn-primary flex-1" 
          onClick={captureAndProcess} 
          disabled={isProcessing || status === 'success'}
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          {isProcessing ? 'Verifying...' : 'Capture & Verify'}
        </button>
        <button className="btn btn-secondary" onClick={toggleCamera} disabled={isProcessing || status === 'success'}>
          <RefreshCw size={18} />
        </button>
        <button className="btn btn-ghost" onClick={() => setIsOn(false)} disabled={isProcessing}>
          Cancel
        </button>
      </div>
      
      {status === 'processing' && (
        <p className="text-center text-sm text-primary animate-pulse mt-sm">
          Securing biometric data...
        </p>
      )}
    </div>
  );
};
