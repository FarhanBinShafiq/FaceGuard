import { useState } from 'react'
import { Camera, Upload, UserCheck, UserX, ShieldAlert, RotateCcw } from 'lucide-react'
import WebcamCapture from '../components/WebcamCapture'
import ImageUpload from '../components/ImageUpload'
import { verifyFace, verifyFaceBase64, getUserImageUrl } from '../services/api'

export default function VerifyPage() {
  const [mode, setMode] = useState('webcam')
  const [capturedImage, setCapturedImage] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const canSubmit = (capturedImage || uploadedFile) && !loading

  const handleVerify = async () => {
    if (!canSubmit) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      let data
      if (mode === 'webcam' && capturedImage) {
        data = await verifyFaceBase64(capturedImage)
      } else if (mode === 'upload' && uploadedFile) {
        data = await verifyFace(uploadedFile)
      }
      setResult(data)
    } catch (err) {
      setError(err.detail || err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCapturedImage(null)
    setUploadedFile(null)
    setResult(null)
    setError(null)
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'registered_user':
        return {
          icon: <UserCheck size={56} />,
          color: 'var(--color-primary)',
          class: 'success',
          title: 'Registered User',
        }
      case 'new_user':
        return {
          icon: <UserX size={56} />,
          color: 'var(--color-warning)',
          class: 'new-user',
          title: 'New User',
        }
      case 'spoof_detected':
        return {
          icon: <ShieldAlert size={56} />,
          color: 'var(--color-danger)',
          class: 'error',
          title: 'Spoof Detected',
        }
      default:
        return {
          icon: <ShieldAlert size={56} />,
          color: 'var(--color-danger)',
          class: 'error',
          title: 'Error',
        }
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Verify Identity</h1>
        <p className="page-subtitle">Submit a face image to check against registered users</p>
      </div>

      <div className="grid-2">
        {/* Left: Image capture */}
        <div className="card">
          <div className="tab-switcher">
            <button
              className={`tab-btn ${mode === 'webcam' ? 'active' : ''}`}
              onClick={() => { setMode('webcam'); setUploadedFile(null) }}
            >
              <Camera size={14} />
              Webcam
            </button>
            <button
              className={`tab-btn ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => { setMode('upload'); setCapturedImage(null) }}
            >
              <Upload size={14} />
              Upload
            </button>
          </div>

          {mode === 'webcam' ? (
            <WebcamCapture onCapture={setCapturedImage} disabled={loading} />
          ) : (
            <ImageUpload onImageSelect={setUploadedFile} disabled={loading} />
          )}

          <div className="mt-lg">
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handleVerify}
              disabled={!canSubmit}
              id="verify-submit"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />
                  Verify Identity
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="card">
          <h3 className="card-title">Verification Result</h3>

          {!result && !error && (
            <div className="empty-state">
              <ShieldAlert size={64} />
              <p style={{ fontWeight: 600, marginBottom: 4 }}>No verification yet</p>
              <p className="text-sm text-muted">Capture or upload a face image and click Verify</p>
            </div>
          )}

          {error && (
            <div className="result-card error">
              <ShieldAlert size={48} color="var(--color-danger)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{error}</p>
              <button className="btn btn-secondary mt-lg" onClick={handleReset}>
                <RotateCcw size={14} /> Try Again
              </button>
            </div>
          )}

          {result && (() => {
            const config = getStatusConfig(result.status)
            return (
              <div className={`result-card ${config.class}`}>
                <div style={{ color: config.color, margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                  {config.icon}
                </div>
                <div className="mb-md">
                  <span className={`badge badge-${config.class === 'success' ? 'success' : config.class === 'new-user' ? 'warning' : 'danger'}`}>
                    {config.title}
                  </span>
                </div>
                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>
                  {result.name || result.message}
                </p>
                {result.name && (
                  <p className="text-sm text-muted mb-md">{result.message}</p>
                )}

                {/* Metrics */}
                <div style={{
                  display: 'grid', gridTemplateColumns: result.name ? '1fr 1fr 1fr' : '1fr 1fr',
                  gap: 12, marginTop: 20, marginBottom: 16
                }}>
                  {result.confidence != null && (
                    <div>
                      <span className="text-sm text-muted">Confidence</span>
                      <p style={{ fontWeight: 700, fontSize: '1.25rem', color: config.color }}>
                        {(result.confidence * 100).toFixed(1)}%
                      </p>
                      <div className="confidence-meter">
                        <div className="confidence-fill" style={{ width: `${result.confidence * 100}%` }} />
                      </div>
                    </div>
                  )}
                  {result.distance != null && (
                    <div>
                      <span className="text-sm text-muted">Distance</span>
                      <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{result.distance}</p>
                    </div>
                  )}
                  {result.anti_spoof_score != null && (
                    <div>
                      <span className="text-sm text-muted">Liveness</span>
                      <p style={{ fontWeight: 700, fontSize: '1.25rem', color: result.is_real_face ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                        {(result.anti_spoof_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Matched user image */}
                {result.user_id && (
                  <div className="mt-md">
                    <img
                      src={getUserImageUrl(result.user_id)}
                      alt="Matched face"
                      style={{
                        width: 80, height: 80, borderRadius: '50%',
                        objectFit: 'cover', border: '3px solid var(--color-primary)',
                        margin: '0 auto'
                      }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}

                <button className="btn btn-secondary mt-lg" onClick={handleReset}>
                  <RotateCcw size={14} /> Verify Another
                </button>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
