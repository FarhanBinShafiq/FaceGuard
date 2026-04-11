import { useState } from 'react'
import { Camera, Upload, CheckCircle, AlertTriangle } from 'lucide-react'
import WebcamCapture from '../components/WebcamCapture'
import ImageUpload from '../components/ImageUpload'
import { registerUser, registerUserBase64 } from '../services/api'

export default function RegisterPage() {
  const [mode, setMode] = useState('webcam') // 'webcam' | 'upload'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [capturedImage, setCapturedImage] = useState(null) // base64 from webcam
  const [uploadedFile, setUploadedFile] = useState(null) // File from upload
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const canSubmit = name.trim() && (capturedImage || uploadedFile) && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      let data
      if (mode === 'webcam' && capturedImage) {
        data = await registerUserBase64(name.trim(), email.trim() || null, capturedImage)
      } else if (mode === 'upload' && uploadedFile) {
        data = await registerUser(name.trim(), email.trim() || null, uploadedFile)
      }
      setResult(data)
    } catch (err) {
      let errorMessage = 'Registration failed'
      if (err.detail) {
        errorMessage = typeof err.detail === 'string' ? err.detail : err.detail.message || JSON.stringify(err.detail)
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName('')
    setEmail('')
    setCapturedImage(null)
    setUploadedFile(null)
    setResult(null)
    setError(null)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Register New User</h1>
        <p className="page-subtitle">Capture or upload a face image to register a new identity</p>
      </div>

      {result ? (
        <div className="result-card success" style={{ maxWidth: 600, margin: '0 auto' }}>
          <CheckCircle size={56} color="var(--color-primary)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Registration Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{result.message}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 450, margin: '0 auto 24px' }}>
            <div>
              <span className="text-sm text-muted">Name</span>
              <p style={{ fontWeight: 600 }}>{result.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted">Liveness Score</span>
              <p style={{ fontWeight: 600 }}>{(result.confidence * 100).toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-sm text-muted">Detected Age</span>
              <p style={{ fontWeight: 600 }}>{result.age} yrs</p>
            </div>
            <div>
              <span className="text-sm text-muted">Gender</span>
              <p style={{ fontWeight: 600, textTransform: 'capitalize' }}>{result.gender}</p>
            </div>
          </div>
          <p className="text-sm text-muted mb-md">User ID: {result.user_id}</p>
          <button className="btn btn-primary" onClick={handleReset}>Register Another</button>
        </div>
      ) : (
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
          </div>

          {/* Right: Form */}
          <div className="card">
            <h3 className="card-title">User Information</h3>
            <div className="input-group mb-lg">
              <label className="input-label">Full Name *</label>
              <input
                className="input"
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                id="register-name"
              />
            </div>
            <div className="input-group mb-lg">
              <label className="input-label">Email (Optional)</label>
              <input
                className="input"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                id="register-email"
              />
            </div>

            <div style={{
              background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
              padding: 16, marginBottom: 24
            }}>
              <p className="text-sm" style={{ fontWeight: 600, marginBottom: 8 }}>Checklist</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8125rem' }}>
                <span style={{ color: name.trim() ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                  {name.trim() ? '✓' : '○'} Name provided
                </span>
                <span style={{ color: (capturedImage || uploadedFile) ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                  {(capturedImage || uploadedFile) ? '✓' : '○'} Face image captured
                </span>
              </div>
            </div>

            {error && (
              <div className="result-card error mb-lg" style={{ padding: 16, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <AlertTriangle size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-danger)' }}>{error}</p>
                </div>
              </div>
            )}

            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handleSubmit}
              disabled={!canSubmit}
              id="register-submit"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Processing...
                </>
              ) : (
                <>Register User</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
