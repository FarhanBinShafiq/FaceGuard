import { useState, useEffect } from 'react'
import { getUsers, deleteUser, getUserImageUrl, updateUserRole } from '../services/api'
import { Users, Trash2, RefreshCw, UserX, Search, ShieldAlert } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data.users)
      setTotal(data.total)
    } catch {
      // Backend not available
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete "${userName}"? This will remove their face data permanently.`)) return
    setDeleting(userId)
    try {
      await deleteUser(userId)
      await loadUsers()
    } catch (err) {
      alert(err.detail || 'Failed to delete user')
    } finally {
      setDeleting(null)
    }
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Registered Users</h1>
        <p className="page-subtitle">{total} user{total !== 1 ? 's' : ''} registered in the system</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input w-full"
            style={{ paddingLeft: 36 }}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="users-search"
          />
        </div>
        <button className="btn btn-secondary" onClick={loadUsers} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinner' : ''} />
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-center" style={{ padding: 'var(--space-3xl)' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <UserX size={64} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>
            {search ? 'No matching users found' : 'No users registered yet'}
          </p>
          <p className="text-sm text-muted">
            {search ? 'Try a different search term' : 'Go to the Register page to add your first user'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="user-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>Name</th>
                <th>Email</th>
                <th>ID</th>
                <th>Role</th>
                <th>Registered</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <img
                      src={getUserImageUrl(user.id)}
                      alt={user.name}
                      className="user-avatar"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td className="text-muted">{user.email || '—'}</td>
                  <td>
                    <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: 4 }}>
                      {user.id.substring(0, 8)}
                    </code>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'blacklisted' ? 'badge-danger' : 'badge-success'}`}>
                      {user.role?.toUpperCase() || 'CUSTOMER'}
                    </span>
                  </td>
                  <td className="text-sm text-muted">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className={`btn btn-icon ${user.role === 'blacklisted' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={async () => {
                          const nextRole = user.role === 'blacklisted' ? 'customer' : 'blacklisted'
                          try {
                            await updateUserRole(user.id, nextRole)
                            loadUsers()
                          } catch (err) { alert(err.detail || 'Update failed') }
                        }}
                        title={user.role === 'blacklisted' ? 'Remove from Blacklist' : 'Add to Blacklist'}
                      >
                        <ShieldAlert size={16} color={user.role === 'blacklisted' ? '#fff' : 'var(--color-danger)'} />
                      </button>

                      <button
                        className="btn btn-icon btn-ghost"
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={deleting === user.id}
                        title="Delete user"
                      >
                        {deleting === user.id ? (
                          <div className="spinner" />
                        ) : (
                          <Trash2 size={16} color="var(--color-danger)" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
