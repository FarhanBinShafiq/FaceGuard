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
    setMessage('Securing biometric signature...');

    try {
      let result;
      if (mode === 'verify') {
        result = await client.verifyFaceBase64(imageBase64);
      } else {
        result = await client.registerUserBase64(config.name || 'Anonymous', config.email || null, imageBase64);
      }

      setStatus('success');
      setMessage(result.message || 'Identity Verified');
      onSuccess?.(result);

      // Auto turn off camera on success after a delay
      setTimeout(() => setIsOn(false), 2500);
    } catch (err) {
      console.error('[FaceGuard SDK] Authentication Error:', err);
      setStatus('error');
      
      // Handle the "Failed to fetch" specially to guide the user
      const errorMsg = err.message === 'Failed to fetch' 
        ? 'Biometric server is unreachable. Please ensure the backend is running.' 
        : (err.detail || err.message || 'Biometric analysis failed');
        
      setMessage(errorMsg);
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
      <div className="face-guard-auth-init card-glass text-center p-xl animate-fade-in">
        <div className="auth-icon-glow mb-lg">
          <ShieldCheck size={48} className="text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-sm">Biometric Authentication</h3>
        <p className="text-muted mb-xl">Secure access via FaceGuard Stealth Biometrics.</p>
        <button className="btn btn-primary btn-lg w-full group" onClick={() => { setIsOn(true); reset(); }}>
          <Camera size={20} className="group-hover:scale-110 transition-transform" />
          <span>Initialize Scanner</span>
        </button>
      </div>
    );
  }

  return (
    <div className="face-guard-auth-active animate-scale-in">
      <div className={`webcam-viewport ${status === 'success' ? 'verified' : status === 'error' ? 'failed' : ''}`}>
        {status === 'success' ? (
          <div className="status-overlay success animate-fade-in">
            <div className="text-center">
              <div className="success-pulse mb-md">
                <ShieldCheck size={72} className="text-success" />
              </div>
              <h3 className="text-2xl font-black text-success tracking-tight">{message}</h3>
              <p className="text-success-light opacity-80 mt-xs">Access Granted</p>
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
              className="webcam-el"
            />
            
            {/* Biometric HUD Overlay */}
            <div className="biometric-hud">
              <div className="scanner-frame">
                <div className="corner top-left" />
                <div className="corner top-right" />
                <div className="corner bottom-left" />
                <div className="corner bottom-right" />
                
                <div className="face-target-area">
                  <div className={`face-oval ${isProcessing ? 'scanning' : ''}`} />
                </div>
              </div>

              {isProcessing && <div className="scanning-bar" />}
              
              <div className="hud-info">
                 <div className="hud-line"></div>
                 <div className="hud-text">
                   <span className="label">MODE:</span>
                   <span className="value">{mode.toUpperCase()}</span>
                 </div>
                 <div className="hud-text">
                   <span className="label">STATUS:</span>
                   <span className={`value ${status === 'error' ? 'text-danger' : 'text-primary'}`}>
                     {status.toUpperCase()}
                   </span>
                 </div>
              </div>
            </div>
            
            {status === 'error' && (
              <div className="status-overlay error animate-fade-in">
                <div className="error-card card-glass border-danger p-lg text-center max-w-xs scale-in">
                  <ShieldAlert size={48} className="text-danger mx-auto mb-md" />
                  <h4 className="text-danger font-bold text-lg mb-sm">Verification Failed</h4>
                  <p className="text-sm text-primary mb-lg leading-relaxed">{message}</p>
                  <button className="btn btn-secondary btn-sm w-full" onClick={reset}>
                    <RefreshCw size={14} /> Try Again
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="auth-controls mt-lg">
        <button 
          className="btn btn-primary btn-lg flex-1" 
          onClick={captureAndProcess} 
          disabled={isProcessing || status === 'success'}
        >
          {isProcessing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <ScanFace size={20} />
          )}
          <span>{isProcessing ? 'Verifying...' : 'Capture & Verify'}</span>
        </button>
        
        <div className="flex gap-sm">
          <button 
            className="btn btn-secondary p-md" 
            onClick={toggleCamera} 
            title="Switch Camera"
            disabled={isProcessing || status === 'success'}
          >
            <RefreshCw size={20} />
          </button>
          <button 
            className="btn btn-ghost p-md text-danger" 
            onClick={() => setIsOn(false)} 
            title="Cancel"
            disabled={isProcessing}
          >
            <CameraOff size={20} />
          </button>
        </div>
      </div>
      
      {isProcessing && (
        <div className="processing-status-bar mt-md">
          <div className="bar-fill" />
          <p className="text-xs text-center text-primary font-bold tracking-widest mt-xs uppercase">
            Analyzing Biometric Vectors
          </p>
        </div>
      )}
    </div>
  );
};
