import { useState } from 'react'
import { Lock, Unlock, ShieldCheck, Mail, Wallet, Settings } from 'lucide-react'
import { FaceGuardAuth } from '../lib'
import { speechService } from '../services/speech'

export default function LockDemoPage() {
  const [isLocked, setIsLocked] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [activeUser, setActiveUser] = useState(null)

  const handleAuthSuccess = (data) => {
    if (data.status === 'registered_user') {
      setIsLocked(false)
      setShowAuth(false)
      setActiveUser(data)
      speechService.welcome(data.name)
    } else {
      speechService.accessDenied()
    }
  }

  const handleLock = () => {
    setIsLocked(true)
    setActiveUser(null)
  }

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <div className="page-header text-center">
        <h1 className="page-title">Personal Vault</h1>
        <p className="page-subtitle">Demonstrating profile locking using biometric verification</p>
      </div>

      <div className="card-glass" style={{ 
        minHeight: 400, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: ' var(--space-xl)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {isLocked ? (
          <div className="text-center animate-fade-in">
            <div style={{ 
              width: 100, height: 100, borderRadius: '50%', 
              background: 'rgba(255,107,107,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              border: '2px dashed rgba(255,107,107,0.3)'
            }}>
              <Lock size={48} color="#FF6B6B" />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12 }}>Vault is Locked</h2>
            <p className="text-muted mb-xl">Verify your face to access your sensitive data and settings.</p>
            
            {!showAuth ? (
              <button className="btn btn-primary btn-lg" onClick={() => setShowAuth(true)}>
                <ShieldCheck size={20} /> Unlock with FaceGuard
              </button>
            ) : (
              <div style={{ width: 320, margin: '0 auto' }}>
                <FaceGuardAuth 
                  mode="verify" 
                  onSuccess={handleAuthSuccess}
                  onError={(err) => console.error(err)}
                />
                <button 
                  className="btn btn-secondary mt-md w-full" 
                  onClick={() => setShowAuth(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full animate-fade-in">
            <div className="flex-between mb-xl">
              <div className="flex-center gap-md">
                <img 
                  src={`/api/users/${activeUser.user_id}/image`} 
                  alt={activeUser.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                />
                <div>
                  <h2 style={{ fontWeight: 800 }}>{activeUser.name}'s Profile</h2>
                  <span className="status-pill success text-xs" style={{ textTransform: 'uppercase' }}>
                    {activeUser.role} Session Active
                  </span>
                </div>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={handleLock}>
                <Lock size={18} /> Lock Vault
              </button>
            </div>

            <div className="grid-2">
              <div className="card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex-center gap-md mb-md" style={{ justifyContent: 'flex-start' }}>
                  <Mail color="var(--color-primary)" size={20} />
                  <h4 style={{ fontWeight: 700 }}>Private Messages</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="text-sm">
                    <p style={{ fontWeight: 600 }}>Support Team</p>
                    <p className="text-muted text-xs">Your security upgrade is complete...</p>
                  </div>
                  <div className="text-sm">
                    <p style={{ fontWeight: 600 }}>System Alert</p>
                    <p className="text-muted text-xs">New login detected from Tokyo...</p>
                  </div>
                </div>
              </div>
              
              <div className="card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex-center gap-md mb-md" style={{ justifyContent: 'flex-start' }}>
                  <Wallet color="var(--color-warning)" size={20} />
                  <h4 style={{ fontWeight: 700 }}>Wallet Balance</h4>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 800 }}>$12,450.00</p>
                <p className="text-xs text-muted mt-sm">Last verified 2 minutes ago</p>
              </div>

              <div className="card" style={{ background: 'rgba(255,255,255,0.03)', gridColumn: 'span 2' }}>
                <div className="flex-center gap-md mb-md" style={{ justifyContent: 'flex-start' }}>
                  <Settings color="var(--color-accent-light)" size={20} />
                  <h4 style={{ fontWeight: 700 }}>Security Settings</h4>
                </div>
                <div className="flex-between text-sm">
                  <span>Biometric Unlock</span>
                  <span className="text-primary" style={{ fontWeight: 700 }}>ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
