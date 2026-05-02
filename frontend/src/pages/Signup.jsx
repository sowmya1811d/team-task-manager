import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Mail, Lock, User, AlertCircle } from 'lucide-react'
import './Auth.css'

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await signup(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.')
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
          <h2>Built for teams<br />that <span>get things done</span></h2>
          <p>From solo projects to large teams — TaskFlow gives everyone clarity on what needs to happen and who's doing it.</p>
        </div>

        <div className="auth-features">
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Create projects and invite your team instantly</span></div>
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Set priorities — Low, Medium, High per task</span></div>
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Never miss a deadline with overdue alerts</span></div>
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Free to use — no credit card required</span></div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-right-top">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>

        <div className="auth-form-wrap">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start managing your team's work today</p>

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrap">
                <User size={16} className="input-icon" />
                <input name="name" type="text" placeholder="Alex Johnson"
                  value={form.name} onChange={handleChange} required />
              </div>
            </div>
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
                <input name="password" type="password" placeholder="Minimum 6 characters"
                  value={form.password} onChange={handleChange} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

    </div>
  )
}
