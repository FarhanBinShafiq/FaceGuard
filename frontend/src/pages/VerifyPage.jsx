import { useState } from 'react'
import { ShieldCheck, UserCheck, ShieldAlert, RotateCcw, Fingerprint, Activity, Zap, Shield, ChevronRight, Camera } from 'lucide-react'
import { FaceGuardAuth } from '../lib'
import { speechService } from '../services/speech'

export default function VerifyPage() {
  const [result, setResult] = useState(null)
  const [isInitializing, setIsInitializing] = useState(false)

  const handleSuccess = (data) => {
    setResult(data)
    if (data.alert_triggered) {
      speechService.securityAlert(data.name)
    } else if (data.status === 'registered_user') {
      speechService.welcome(data.name)
    } else if (data.status === 'spoof_detected') {
      speechService.spoofDetected()
    } else {
      speechService.accessDenied()
    }
  }

  const handleReset = () => {
    setResult(null)
    setIsInitializing(false)
  }

  return (
    <div className="premium-mesh-bg min-h-[80vh] flex flex-col items-center py-2xl">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="page-header text-center animate-fade-in mb-3xl">
        <div className="flex justify-center mb-md">
          <div className="px-md py-xs bg-secondary border border-default rounded-lg flex items-center gap-sm backdrop-blur-md">
            <Shield size={14} className="text-primary" />
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Identity Verification Module</span>
          </div>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-sm text-primary">
          Verification Portal
        </h1>
        <p className="text-muted text-base max-w-lg mx-auto leading-relaxed">
          Standardized biometric authentication for enterprise-grade security environments.
        </p>
      </div>

      <div className="w-full max-w-4xl px-lg">
        {!result ? (
          <div className="flex flex-col items-center">
            {!isInitializing ? (
              <div className="glass-premium p-2xl text-center w-full max-w-lg animate-slide-up shadow-xl border-default">
                <div className="auth-icon-glow mb-lg">
                  <Fingerprint size={48} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-sm tracking-tight">Security Checkpoint</h2>
                <p className="text-muted mb-xl text-sm leading-relaxed">Please initialize the biometric scanner to proceed with identity verification.</p>
                <button 
                  className="btn btn-primary btn-lg w-full group py-md" 
                  onClick={() => setIsInitializing(true)}
                >
                  <Camera size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Launch Biometric Scanner</span>
                  <ChevronRight size={18} className="ml-auto opacity-50" />
                </button>
              </div>
            ) : (
              <div className="w-full max-w-md animate-scale-in">
                <FaceGuardAuth 
                  mode="verify" 
                  onSuccess={handleSuccess} 
                  onError={(err) => {
                    console.error(err);
                    speechService.accessDenied();
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto animate-slide-up">
            {result.status === 'registered_user' ? (
              <div className="identity-card-container">
                <div className="flex items-center gap-md mb-lg px-md">
                  <div className="p-sm bg-success-20 rounded-lg">
                     <ShieldCheck size={18} className="text-success" />
                  </div>
                  <h2 className="text-lg font-bold text-success tracking-tight uppercase">Identity Confirmed</h2>
                </div>

                <div className="identity-card glass-premium">
                  <div className="id-photo-container">
                    <img 
                      src={`/api/users/${result.user_id}/image`} 
                      alt={result.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="id-badge-scan-line" />
                  </div>

                  <div className="id-details px-md">
                    <div className="id-field">
                      <div className="id-label">Employee Name</div>
                      <div className="id-value text-xl font-bold">{result.name}</div>
                    </div>

                    <div className="grid grid-cols-1 gap-md mt-sm">
                      <div className="id-field">
                        <div className="id-label">Assigned Role</div>
                        <div className="badge badge-info mt-xs">{result.role?.toUpperCase()}</div>
                      </div>
                      <div className="id-field">
                        <div className="id-label">Access Authorization</div>
                        <div className="text-sm font-semibold uppercase text-primary">Standard Clearance Lvl 4</div>
                      </div>
                    </div>

                    <div className="mt-lg pt-md border-t border-default flex items-center justify-between">
                       <div className="flex items-center gap-sm">
                         <Activity size={12} className="text-success" />
                         <span className="text-[10px] font-mono text-muted uppercase">Liveness Verified</span>
                       </div>
                       <div className="text-[10px] font-mono text-muted font-bold opacity-30">
                         TX_{Date.now().toString().slice(-6)}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-xl flex gap-md">
                   <button className="btn btn-primary flex-1 py-md" onClick={() => (window.location.href = '/dashboard')}>
                      Access Dashboard
                   </button>
                   <button className="btn btn-secondary px-lg" onClick={handleReset} title="Restart">
                      <RotateCcw size={18} />
                   </button>
                </div>
              </div>
            ) : (
              <div className={`glass-premium border-danger/20 p-2xl text-center animate-scale-in`}>
                <div className="p-lg bg-danger-20 rounded-full border border-danger-20 inline-flex mb-lg">
                  <ShieldAlert size={48} className="text-danger" />
                </div>
                
                <h2 className={`text-2xl font-bold mb-sm tracking-tight text-danger`}>
                   {result.alert_triggered ? 'Unauthorized Access' : 'Identity Mismatch'}
                 </h2>
                 <p className="text-sm text-muted mb-xl leading-relaxed max-w-xs mx-auto">
                   {result.alert_triggered 
                     ? `The system has flagged a restricted identity: ${result.name}` 
                     : (result.message || 'Security protocols could not validate the biometric signature.')}
                 </p>
                 
                <button className="btn btn-secondary btn-lg w-full group py-md" onClick={handleReset}>
                  <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span>Retry Verification</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* ── Visual Footer ─────────────────────────────────── */}
      <div className="mt-auto w-full max-w-4xl pt-2xl opacity-40">
        <div className="flex flex-col md:flex-row justify-between items-center gap-lg border-t border-white/5 pt-xl">
          <div className="flex items-center gap-sm">
             <Shield size={16} className="text-primary" />
             <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Biometric Engine: ACTIVE</span>
          </div>
          <div className="flex gap-xl grayscale hover:grayscale-0 transition-all">
             <span className="text-[10px] font-mono uppercase font-bold tracking-tighter">RSA-4096 End-to-End</span>
             <span className="text-[10px] font-mono uppercase font-bold tracking-tighter">ISO/IEC 27001 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  )
}
