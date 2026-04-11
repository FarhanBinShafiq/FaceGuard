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
      <div className="animate-scale-in">
        <div className="webcam-viewport verified mb-md">
          <img src={capturedImage} alt="Captured face" className="webcam-el" />
          <div className="status-overlay success">
             <CheckCircle size={48} className="text-success" />
          </div>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-secondary flex-1" onClick={handleRetake}>
            <RotateCcw size={16} /> Retake Photo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in text-center">
      <div className="webcam-viewport active mb-md">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.92}
          videoConstraints={videoConstraints}
          mirrored={facingMode === 'user'}
          className="webcam-el"
        />
        <div className="biometric-hud">
          <div className="face-target-area">
             <div className="face-oval" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-sm">
        <button className="btn btn-primary btn-lg flex-1" onClick={handleCapture} disabled={disabled}>
          <Camera size={20} />
          <span>Capture Biometrics</span>
        </button>
        <button className="btn btn-secondary p-md" onClick={toggleCamera} title="Switch Camera">
          <RefreshCw size={20} />
        </button>
        <button className="btn btn-ghost p-md text-danger" onClick={() => { setIsOn(false); setCapturedImage(null); onCapture?.(null) }}>
          <CameraOff size={20} />
        </button>
      </div>
    </div>
  )
}
