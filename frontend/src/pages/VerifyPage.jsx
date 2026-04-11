import { useState } from 'react'
import { ShieldCheck, UserCheck, ShieldAlert, RotateCcw, Fingerprint, Activity } from 'lucide-react'
import { FaceGuardAuth } from '../lib'
import { speechService } from '../services/speech'

export default function VerifyPage() {
  const [result, setResult] = useState(null)

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
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header text-center animate-fade-in">
        <div className="flex justify-center mb-md">
          <div className="px-md py-xs bg-primary-glow border border-primary-20 rounded-full flex items-center gap-sm">
            <Fingerprint size={14} className="text-primary" />
            <span className="text-xs font-bold tracking-widest text-primary uppercase">Biometric Secure Node</span>
          </div>
        </div>
        <h1 className="page-title text-5xl mb-sm">Verification Portal</h1>
        <p className="page-subtitle text-lg">Identity authentication powered by FaceGuard Stealth SDK</p>
      </div>

      <div className="flex justify-center mb-2xl">
        {!result ? (
          <div className="w-full max-w-md animate-scale-in">
            <FaceGuardAuth 
              mode="verify" 
              onSuccess={handleSuccess} 
              onError={(err) => console.error(err)}
            />
          </div>
        ) : (
          <div className={`result-card w-full max-w-lg glass-morphism ${result.status === 'registered_user' ? 'success' : 'error'} p-2xl`}>
            <div className="flex justify-center mb-xl">
              {result.status === 'registered_user' ? (
                <div className="p-xl bg-success-20 rounded-full border border-success-40 shadow-glow-success">
                  <UserCheck size={80} className="text-success" />
                </div>
              ) : (
                <div className="p-xl bg-danger-20 rounded-full border border-danger-40 shadow-glow-danger">
                  <ShieldAlert size={80} className="text-danger" />
                </div>
              )}
            </div>
            
            <h2 className={`text-3xl font-black mb-md tracking-tighter ${result.alert_triggered ? 'text-danger animate-pulse' : ''}`}>
               {result.alert_triggered ? '🚨 BLACKLIST ALERT' : (result.status === 'registered_user' ? 'ACCESS GRANTED' : 'ACCESS DENIED')}
             </h2>
             <p className="text-lg text-muted mb-xl leading-relaxed">
               {result.alert_triggered ? `Unauthorized Access Attempt by Blacklisted User: ${result.name}` : result.message}
             </p>
             
             {result.status === 'registered_user' && (
               <div className="card-glass p-lg mb-xl flex items-center gap-lg border-primary-20 hover:border-primary-40 transition-colors shadow-lg">
                 <div className="relative">
                   <img 
                     src={`/api/users/${result.user_id}/image`} 
                     alt={result.name}
                     className="w-24 h-24 rounded-2xl object-cover border-2 border-primary shadow-glow"
                   />
                   <div className="absolute -bottom-2 -right-2 bg-primary p-xs rounded-lg">
                     <ShieldCheck size={16} className="text-inverse" />
                   </div>
                 </div>
                 <div className="text-left">
                   <p className="font-black text-2xl tracking-tight">{result.name}</p>
                   <div className="flex flex-wrap gap-sm mt-xs">
                     <span className={`badge ${result.alert_triggered ? 'badge-danger' : 'badge-info'}`}>
                       ROLE: {result.role?.toUpperCase()}
                     </span>
                     <span className="badge badge-success">
                       <Activity size={10} /> {result.emotion?.toUpperCase()}
                     </span>
                   </div>
                   <p className="text-xs text-muted mt-md font-mono">ID: {result.user_id}</p>
                 </div>
               </div>
             )}

            <button className="btn btn-secondary btn-lg w-full group" onClick={handleReset}>
              <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              <span>Retry Authentication</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Visual Footer */}
      <div className="mt-3xl border-t border-default pt-xl flex flex-col md:flex-row justify-between items-center gap-lg opacity-40">
        <div className="flex items-center gap-sm">
           <Activity size={16} className="text-primary" />
           <span className="text-xs font-mono uppercase tracking-widest text-primary">System Integrity: Nominal</span>
        </div>
        <div className="flex gap-xl grayscale hover:grayscale-0 transition-all">
           <span className="text-[10px] font-mono uppercase font-bold tracking-tighter">AES-256 Encryption Active</span>
           <span className="text-[10px] font-mono uppercase font-bold tracking-tighter">Liveness Detection Active</span>
        </div>
      </div>
    </div>
  )
}

