import { useState, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import { analyzeCrowdBase64 } from '../services/api'
import { 
  Users, User, TrendingUp, BarChart3, 
  Map as MapIcon, Calendar, ArrowLeft 
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AnalyticsPage() {
  const webcamRef = useRef(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isAutoScanning, setIsAutoScanning] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    males: 0,
    females: 0,
    avgAge: 0
  })

  // Capture and analyze a frame
  const capture = async () => {
    if (!webcamRef.current) return
    const imageBase64 = webcamRef.current.getScreenshot()
    if (!imageBase64) return

    try {
      setLoading(true)
      const data = await analyzeCrowdBase64(imageBase64)
      setResults(data)
      
      // Update aggregate stats
      if (data.faces.length > 0) {
        const males = data.faces.filter(f => f.gender === 'male').length
        const females = data.faces.filter(f => f.gender === 'female').length
        const totalAge = data.faces.reduce((sum, f) => sum + (f.age || 0), 0)
        
        setStats({
          total: data.total_faces,
          males,
          females,
          avgAge: Math.round(totalAge / data.faces.length)
        })
      }
    } catch (err) {
      console.error('Crowd analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-scan every 3 seconds
  useEffect(() => {
    let interval
    if (isAutoScanning) {
      interval = setInterval(() => {
        capture()
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isAutoScanning])

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" className="btn btn-secondary btn-icon" style={{ borderRadius: '50%', width: 40, height: 40, padding: 0 }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title">Supermarket Analytics</h1>
          <p className="page-subtitle">Real-time crowd analysis and demographics</p>
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', gap: 'var(--space-xl)' }}>
        {/* Left: Camera & Overlays */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="webcam-view"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            
            {/* Loading Indicator */}
            {loading && (
              <div style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(0,0,0,0.6)', padding: '8px 16px',
                borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8,
                zIndex: 10, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div className="spinner spinner-sm" />
                <span className="text-xs" style={{ color: '#fff', fontWeight: 600 }}>ANALYZING...</span>
              </div>
            )}

            {/* Bounding Box Overlays */}
            {results?.faces.map((face, index) => {
              const [x1, y1, x2, y2] = face.bbox
              // Since we don't know the exact resolution without extra math, 
              // we'll just show the tags for now below the camera if we can't map them perfectly.
              // For a true "Supermarket Level" we'd calculate percentages here.
              // For this demo, we'll display them as a list on the right.
              return null
            })}
          </div>
          
          <div className="p-lg flex-between">
            <div className="flex-center gap-md">
              <div className={`status-pill ${isAutoScanning ? 'success' : 'warning'}`}>
                {isAutoScanning ? 'Live Scanning' : 'Paused'}
              </div>
              <span className="text-sm text-muted">Interval: 3s</span>
            </div>
            <button 
              className={`btn ${isAutoScanning ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => setIsAutoScanning(!isAutoScanning)}
            >
              {isAutoScanning ? 'Stop Auto-Scan' : 'Start Auto-Scan'}
            </button>
          </div>
        </div>

        {/* Right: Real-time Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="card">
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--color-primary)" />
              Crowd Metrics
            </h3>
            
            <div className="mt-lg" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="flex-between">
                <div className="flex-center gap-sm">
                  <div className="stat-icon-mini" style={{ color: 'var(--color-primary)' }}><Users size={16} /></div>
                  <span className="text-sm">Total People</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{stats.total}</span>
              </div>
              
              <div className="flex-between">
                <div className="flex-center gap-sm">
                  <div className="stat-icon-mini" style={{ color: 'var(--color-accent-light)' }}><User size={16} /></div>
                  <span className="text-sm">Male / Female</span>
                </div>
                <span style={{ fontWeight: 600 }}>{stats.males} / {stats.females}</span>
              </div>

              <div className="flex-between">
                <div className="flex-center gap-sm">
                  <div className="stat-icon-mini" style={{ color: 'var(--color-warning)' }}><Calendar size={16} /></div>
                  <span className="text-sm">Avg. Age</span>
                </div>
                <span style={{ fontWeight: 600 }}>{stats.avgAge} years</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, minHeight: 300, display: 'flex', flexDirection: 'column' }}>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--color-accent-light)" />
              Detected Individuals
            </h3>
            
            <div className="mt-md" style={{ overflowY: 'auto', flex: 1 }}>
              {results?.faces.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {results.faces.map((face, index) => (
                    <div key={index} className="flex-between p-sm" style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {face.matched_name || `Unknown #${index + 1}`}
                        </div>
                        <div className="text-xs text-muted">
                          {face.gender}, ~{face.age} yrs
                        </div>
                      </div>
                      <div className="text-xs" style={{ 
                        padding: '2px 8px', 
                        borderRadius: 10, 
                        background: face.matched_id ? 'rgba(6,214,160,0.1)' : 'rgba(255,255,255,0.05)',
                        color: face.matched_id ? 'var(--color-primary)' : 'inherit'
                      }}>
                        {face.matched_id ? 'VIP' : 'Customer'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-center" style={{ height: '100%', flexDirection: 'column', color: 'var(--text-muted)' }}>
                  <Users size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <p className="text-sm">No faces detected in view</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
