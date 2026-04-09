import { useState, useEffect } from 'react'
import { getAudits } from '../services/api'
import { 
  FileSearch, CheckCircle, XCircle, 
  AlertTriangle, Clock, User, Fingerprint 
} from 'lucide-react'

export default function AuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const data = await getAudits()
        setLogs(data.logs)
        setTotal(data.total)
      } catch (err) {
        console.error('Failed to load audits:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'var(--color-primary)';
      case 'failed': return 'var(--color-danger)';
      case 'spoof_detected': return 'var(--color-warning)';
      default: return 'var(--text-muted)';
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} />;
      case 'failed': return <XCircle size={16} />;
      case 'spoof_detected': return <AlertTriangle size={16} />;
      default: return <Clock size={16} />;
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Enterprise Audit Logs</h1>
        <p className="page-subtitle">Real-time monitoring of all biometric events and security attempts</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSearch size={18} color="var(--color-primary)" />
            System Events ({total})
          </h3>
          <div className="text-sm text-muted">Showing latest 50 entries</div>
        </div>

        {loading ? (
          <div className="flex-center p-xl">
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 24px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Event</th>
                  <th style={{ padding: '12px 24px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
                  <th style={{ padding: '12px 24px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 24px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confidence</th>
                  <th style={{ padding: '12px 24px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div className="flex-center gap-sm" style={{ justifyContent: 'flex-start' }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: 8, 
                          background: 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {log.event_type === 'verify' ? <Fingerprint size={16} /> : <User size={16} />}
                        </div>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{log.event_type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {log.user_name || <span className="text-muted">Anonymous</span>}
                      {log.user_id && <div className="text-xs text-muted">ID: {log.user_id.slice(0, 8)}...</div>}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div className="flex-center gap-xs" style={{ 
                        justifyContent: 'flex-start',
                        color: getStatusColor(log.status),
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}>
                        {getStatusIcon(log.status)}
                        <span style={{ textTransform: 'capitalize' }}>{log.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {log.confidence ? `${(parseFloat(log.confidence) * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {logs.length === 0 && (
              <div className="flex-center p-xl text-muted" style={{ flexDirection: 'column' }}>
                <Clock size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                <p>No audit logs recorded yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
