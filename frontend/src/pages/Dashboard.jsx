import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getHealth, getStats } from '../services/api'
import {
  ScanFace, UserPlus, ShieldCheck, Users,
  Activity, Database, Cpu, Shield
} from 'lucide-react'

export default function Dashboard() {
  const [health, setHealth] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [h, s] = await Promise.all([getHealth(), getStats()])
        setHealth(h)
        setStats(s)
      } catch (err) {
        setError('Backend not reachable. Make sure the server is running on port 8000.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Face Recognition System — Overview & Quick Actions</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex-center mt-xl">
          <div className="spinner spinner-lg" />
        </div>
      ) : error ? (
        <div className="result-card error mb-lg">
          <Activity size={32} style={{ marginBottom: 8 }} />
          <p style={{ fontWeight: 600 }}>{error}</p>
          <p className="text-sm text-muted mt-sm">
            Run: <code>cd backend && uvicorn app.main:app --reload</code>
          </p>
        </div>
      ) : (
        <div className="grid-3 mb-lg" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <Activity size={18} color="var(--color-primary)" />
            </div>
            <div className="stat-value" style={{ color: health?.status === 'healthy' ? 'var(--color-primary)' : 'var(--color-danger)' }}>
              {health?.status === 'healthy' ? '●' : '○'}
            </div>
            <div className="stat-label">{health?.status || 'Unknown'}</div>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <Users size={18} color="var(--color-accent-light)" />
            </div>
            <div className="stat-value">{stats?.total_users ?? '—'}</div>
            <div className="stat-label">Registered Users</div>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <Database size={18} color="var(--color-warning)" />
            </div>
            <div className="stat-value">{stats?.faiss_index_size ?? '—'}</div>
            <div className="stat-label">FAISS Embeddings</div>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <Shield size={18} color={stats?.anti_spoof_enabled ? 'var(--color-primary)' : 'var(--color-danger)'} />
            </div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>
              {stats?.anti_spoof_enabled ? 'Enabled' : 'Disabled'}
            </div>
            <div className="stat-label">Anti-Spoofing</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Quick Actions</h2>
      <div className="grid-3">
        <Link to="/register" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(6,214,160,0.15), rgba(6,214,160,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(6,214,160,0.2)'
              }}>
                <UserPlus size={22} color="var(--color-primary)" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Register User</h3>
                <p className="text-sm text-muted">Add a new face to the database</p>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Capture a face via webcam or upload an image to register a new user with face recognition capabilities.
            </p>
          </div>
        </Link>
        <Link to="/verify" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(17,138,178,0.15), rgba(17,138,178,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(17,138,178,0.2)'
              }}>
                <ShieldCheck size={22} color="var(--color-accent-light)" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Verify Face</h3>
                <p className="text-sm text-muted">Check identity against database</p>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Submit a face image to verify identity. Returns match confidence, anti-spoofing score, and user details.
            </p>
          </div>
        </Link>
        <Link to="/users" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(255,209,102,0.15), rgba(255,209,102,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,209,102,0.2)'
              }}>
                <Users size={22} color="var(--color-warning)" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Manage Users</h3>
                <p className="text-sm text-muted">View and manage registered users</p>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Browse all registered users, view their face images, and manage the user database.
            </p>
          </div>
        </Link>
        <Link to="/analytics" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,107,107,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,107,107,0.2)'
              }}>
                <Activity size={22} color="#FF6B6B" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Supermarket Mode</h3>
                <p className="text-sm text-muted">Crowd analysis & demographics</p>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Experience real-time crowd detection, age estimation, and gender distribution for retail environments.
            </p>
          </div>
        </Link>
        <Link to="/vault" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(155,89,182,0.15), rgba(155,89,182,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(155,89,182,0.2)'
              }}>
                <Shield size={22} color="#9b59b6" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Personal Vault</h3>
                <p className="text-sm text-muted">Face-to-Unlock demo</p>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Experience the "Unlock with Face" feature to secure private messages and financial data.
            </p>
          </div>
        </Link>
        <Link to="/audits" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(52,73,94,0.15), rgba(52,73,94,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(52,73,94,0.2)'
              }}>
                <Activity size={22} color="#34495e" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Audit Logs</h3>
                <p className="text-sm text-muted">Enterprise event monitoring</p>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Detailed logs of every biometric event, including successes, failures, and spoof attempts.
            </p>
          </div>
        </Link>
      </div>

      {/* System Info */}
      {stats && (
        <div className="card mt-xl" style={{ background: 'rgba(17,138,178,0.05)', borderColor: 'rgba(17,138,178,0.15)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} color="var(--color-accent-light)" />
            System Configuration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <span className="text-sm text-muted">Embedding Dimensions</span>
              <p style={{ fontWeight: 600 }}>{stats.embedding_dim}D</p>
            </div>
            <div>
              <span className="text-sm text-muted">Similarity Threshold</span>
              <p style={{ fontWeight: 600 }}>{stats.similarity_threshold}</p>
            </div>
            <div>
              <span className="text-sm text-muted">Version</span>
              <p style={{ fontWeight: 600 }}>{health?.version || '—'}</p>
            </div>
            <div>
              <span className="text-sm text-muted">Search Engine</span>
              <p style={{ fontWeight: 600 }}>FAISS (Flat IP)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
