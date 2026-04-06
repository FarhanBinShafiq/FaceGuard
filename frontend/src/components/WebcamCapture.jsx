import { useRef, useCallback, useState } from 'react'
import Webcam from 'react-webcam'
import { Camera, CameraOff, RotateCcw, RefreshCw } from 'lucide-react'

export default function WebcamCapture({ onCapture, disabled = false }) {
  const webcamRef = useRef(null)
  const [isOn, setIsOn] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [facingMode, setFacingMode] = useState('user')

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: facingMode,
  }

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      onCapture?.(imageSrc)
    }
  }, [onCapture])

  const handleRetake = () => {
    setCapturedImage(null)
    onCapture?.(null)
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  if (!isOn) {
    return (
      <div className="webcam-container">
        <div className="webcam-overlay">
          <CameraOff size={48} />
          <p>Camera is off</p>
          <button className="btn btn-primary" onClick={() => setIsOn(true)} disabled={disabled}>
            <Camera size={16} />
            Turn On Camera
          </button>
        </div>
      </div>
    )
  }

  if (capturedImage) {
    return (
      <div>
        <div className="webcam-container active">
          <img src={capturedImage} alt="Captured face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="mt-md" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleRetake}>
            <RotateCcw size={16} />
            Retake
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="webcam-container active">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.92}
          videoConstraints={videoConstraints}
          mirrored={facingMode === 'user'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="face-guide">
          <div className="face-guide-circle" />
        </div>
        <div className="webcam-scan-line" />
      </div>
      <div className="mt-md" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button className="btn btn-primary" onClick={handleCapture} disabled={disabled} style={{ flex: 1 }}>
          <Camera size={16} />
          Capture
        </button>
        <button className="btn btn-secondary" onClick={toggleCamera} title="Switch Camera">
          <RefreshCw size={16} />
          Switch
        </button>
        <button className="btn btn-ghost" onClick={() => { setIsOn(false); setCapturedImage(null); onCapture?.(null) }}>
          <CameraOff size={16} />
          Off
        </button>
      </div>
    </div>
  )
}
