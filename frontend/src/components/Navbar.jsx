import { NavLink } from 'react-router-dom'
import { ScanFace, UserPlus, ShieldCheck, Users } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">
            <ScanFace size={20} color="#0a0e1a" />
          </div>
          FaceRecog
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ScanFace size={16} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <UserPlus size={16} />
            <span>Register</span>
          </NavLink>
          <NavLink to="/verify" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ShieldCheck size={16} />
            <span>Verify</span>
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={16} />
            <span>Users</span>
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
