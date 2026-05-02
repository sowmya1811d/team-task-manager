import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react'
import './Auth.css'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">

      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-left-grid" />
        <div className="auth-left-glow1" />
        <div className="auth-left-glow2" />

        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Zap size={22} color="#fff" fill="#fff" />
          </div>
          TaskFlow
        </div>

        <div className="auth-hero">
          <h2>Manage your team's<br /><span>work effortlessly</span></h2>
          <p>A powerful task manager for modern teams. Organize projects, assign tasks, and track progress — all in one place.</p>
        </div>

        <div className="auth-features">
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Role-based access — Admin & Member controls</span></div>
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Kanban board with real-time status updates</span></div>
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Dashboard with overdue tracking & analytics</span></div>
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Assign tasks with priority and due dates</span></div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-right-top">
          Don't have an account? <Link to="/signup">Sign up free</Link>
        </div>

        <div className="auth-form-wrap">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your workspace to continue</p>

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div className="input-icon-wrap">
                <Mail size={16} className="input-icon" />
                <input name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input name="password" type="password" placeholder="Enter your password"
                  value={form.password} onChange={handleChange} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            New to TaskFlow? <Link to="/signup">Create a free account</Link>
          </p>
        </div>
      </div>

    </div>
  )
}
