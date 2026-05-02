import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { Plus, FolderKanban, Users, CheckSquare, Trash2, X } from 'lucide-react'
import './Projects.css'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchProjects = () => {
    api.get('/projects').then(r => setProjects(r.data.projects)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const handleCreate = async e => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/projects', form)
      setShowModal(false)
      setForm({ name: '', description: '' })
      fetchProjects()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this project and all its tasks?')) return
    try {
      await api.delete(`/projects/${id}`)
      setProjects(p => p.filter(pr => pr.id !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete')
    }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" style={{ width:32,height:32 }} /></div>

  return (
    <div className="projects-page">
      <div className="page-header">
        <h1 style={{ fontSize:28, fontFamily:'Syne' }}>Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} color="var(--border2)" />
          <h3>No projects yet</h3>
          <p>Create your first project to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop:16 }}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <Link to={`/projects/${p.id}`} key={p.id} className="project-card">
              <div className="project-card-header">
                <div className="project-icon"><FolderKanban size={20} /></div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span className={`badge badge-${p.user_role}`}>{p.user_role}</span>
                  {p.user_role === 'admin' && (
                    <button className="icon-btn-danger" onClick={e => handleDelete(p.id, e)} title="Delete project">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="project-name">{p.name}</h3>
              {p.description && <p className="project-desc">{p.description}</p>}
              <div className="project-meta">
                <span><Users size={13} /> {p.member_count} member{p.member_count !== 1 ? 's' : ''}</span>
                <span><CheckSquare size={13} /> {p.task_count} task{p.task_count !== 1 ? 's' : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>New Project</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            {error && <div className="auth-error" style={{ marginBottom:16, display:'flex', gap:8, alignItems:'center', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'var(--red)', padding:'10px 14px', borderRadius:'var(--radius-sm)', fontSize:13 }}>{error}</div>}
            <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input placeholder="e.g. Website Redesign" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea placeholder="What is this project about?" rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ resize:'vertical' }} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
