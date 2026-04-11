import { useState } from 'react'
import { ShieldCheck, UserCheck, ShieldAlert, RotateCcw } from 'lucide-react'
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
      <div className="page-header text-center">
        <h1 className="page-title">Biometric Verification</h1>
        <p className="page-subtitle">Powered by FaceGuard Stealth SDK</p>
      </div>

      <div className="flex justify-center mb-xl">
        {!result ? (
          <div className="w-full max-w-md">
            <FaceGuardAuth 
              mode="verify" 
              onSuccess={handleSuccess} 
              onError={(err) => console.error(err)}
            />
          </div>
        ) : (
          <div className={`result-card w-full max-w-lg ${result.status === 'registered_user' ? 'success' : 'error'}`}>
            <div className="flex justify-center mb-lg">
              {result.status === 'registered_user' ? (
                <UserCheck size={64} className="text-success" />
              ) : (
                <ShieldAlert size={64} className="text-danger" />
              )}
            </div>
            
            <h2 className={`text-2xl font-bold mb-sm ${result.alert_triggered ? 'text-danger animate-pulse' : ''}`}>
               {result.alert_triggered ? '🚨 SECURITY ALERT' : (result.status === 'registered_user' ? 'Access Granted' : 'Access Denied')}
             </h2>
             <p className="text-muted mb-lg">
               {result.alert_triggered ? `Unauthorized Access Attempt by Blacklisted User: ${result.name}` : result.message}
             </p>
             
             {result.status === 'registered_user' && (
               <div className={`card-glass p-md mb-lg flex items-center gap-md ${result.alert_triggered ? 'border-danger' : ''}`} style={{ border: result.alert_triggered ? '2px solid var(--color-danger)' : '' }}>
                 <img 
                   src={`/api/users/${result.user_id}/image`} 
                   alt={result.name}
                   className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                 />
                 <div className="text-left">
                   <p className="font-bold text-lg">{result.name}</p>
                   <p className="text-sm text-muted">Role: <span className={result.alert_triggered ? 'text-danger' : 'text-primary'}>{result.role?.toUpperCase()}</span></p>
                   <p className="text-sm font-semibold">Mood: {result.emotion?.toUpperCase()}</p>
                 </div>
               </div>
             )}

            <button className="btn btn-secondary w-full" onClick={handleReset}>
              <RotateCcw size={16} /> Verify Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

