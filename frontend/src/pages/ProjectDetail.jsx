import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { Plus, Users, ChevronLeft, X, Trash2, UserPlus, Pencil } from 'lucide-react'
import { format, parseISO, isValid, isPast } from 'date-fns'
import './ProjectDetail.css'

const STATUSES = ['todo', 'inprogress', 'done']
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' }
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' }

function TaskCard({ task, isAdmin, currentUserId, onUpdate, onDelete, members }) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(task.status)
  const [saving, setSaving] = useState(false)

  // Members can only update status on tasks assigned to them
  const isAssignedToMe = task.assigned_to === currentUserId
  const canUpdateStatus = isAdmin || isAssignedToMe

  const handleStatusChange = async newStatus => {
    setStatus(newStatus)
    setSaving(true)
    try { await onUpdate(task.id, { status: newStatus }) } catch { setStatus(task.status) }
    finally { setSaving(false) }
  }

  const due = task.due_date ? parseISO(task.due_date) : null
  const isOverdue = due && isValid(due) && isPast(due) && task.status !== 'done'

  return (
    <div className={`task-card ${task.status}`}>
      <div className="task-card-header">
        <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
        <div style={{ display:'flex', gap:6 }}>
          {isAdmin && (
            <>
              <button className="icon-btn" onClick={() => setEditing(true)} title="Edit"><Pencil size={13} /></button>
              <button className="icon-btn icon-btn-red" onClick={() => onDelete(task.id)} title="Delete"><Trash2 size={13} /></button>
            </>
          )}
        </div>
      </div>
      <h4 className="task-title">{task.title}</h4>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-meta">
        {task.assigned_name && <span className="task-assignee">{task.assigned_name[0].toUpperCase()}<span>{task.assigned_name}</span></span>}
        {due && isValid(due) && <span className={isOverdue ? 'overdue' : ''} style={{ fontSize:12 }}>{format(due, 'MMM d, yyyy')}</span>}
      </div>
      <div className="task-status-row">
        {canUpdateStatus ? (
          <>
            <select value={status} onChange={e => handleStatusChange(e.target.value)} disabled={saving} className="status-select">
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            {saving && <span className="spinner" style={{ width:14, height:14 }} />}
          </>
        ) : (
          <span className={`badge badge-${task.status}`} style={{ fontSize:12 }}>{STATUS_LABELS[task.status]}</span>
        )}
      </div>
      {editing && (
        <EditTaskModal task={task} members={members} onClose={() => setEditing(false)}
          onSave={async data => { await onUpdate(task.id, data); setEditing(false) }} />
      )}
    </div>
  )
}

function EditTaskModal({ task, members, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task.title, description: task.description || '',
    priority: task.priority, due_date: task.due_date || '', assigned_to: task.assigned_to || ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true)
    try { await onSave({ ...form, assigned_to: form.assigned_to || null }) }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize:'vertical' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddMemberRow({ user, onAdd }) {
  const [role, setRole] = useState('member')
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div className="member-avatar">{user.name?.[0]?.toUpperCase()}</div>
        <div>
          <div style={{ fontWeight:500, fontSize:14 }}>{user.name}</div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>{user.email}</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          style={{ padding:'5px 10px', fontSize:12, borderRadius:6, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', cursor:'pointer' }}
        >
          <option value="member">member</option>
          <option value="admin">admin</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => onAdd(user.id, role)}>
          <UserPlus size={13} /> Add
        </button>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [taskForm, setTaskForm] = useState({ title:'', description:'', priority:'medium', due_date:'', assigned_to:'' })
  const [submitting, setSubmitting] = useState(false)
  const [taskError, setTaskError] = useState('')

  const isAdmin = project?.user_role === 'admin'

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([api.get(`/projects/${id}`), api.get(`/tasks/project/${id}`)])
      setProject(pRes.data.project)
      setTasks(tRes.data.tasks)
    } catch (err) {
      if (err.response?.status === 403) navigate('/projects')
    } finally { setLoading(false) }
  }, [id, navigate])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => {
    if (showMemberModal) api.get('/auth/users').then(r => setAllUsers(r.data.users)).catch(console.error)
  }, [showMemberModal])

  const handleCreateTask = async e => {
    e.preventDefault(); setTaskError(''); setSubmitting(true)
    try {
      await api.post('/tasks', { ...taskForm, project_id: id, assigned_to: taskForm.assigned_to || null })
      setShowTaskModal(false)
      setTaskForm({ title:'', description:'', priority:'medium', due_date:'', assigned_to:'' })
      fetchAll()
    } catch (err) { setTaskError(err.response?.data?.error || 'Failed to create task') }
    finally { setSubmitting(false) }
  }

  const handleUpdateTask = async (taskId, data) => {
    await api.put(`/tasks/${taskId}`, data)
    fetchAll()
  }

  const handleDeleteTask = async taskId => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/tasks/${taskId}`)
    setTasks(t => t.filter(tk => tk.id !== taskId))
  }

  const handleAddMember = async (userId, role = 'member') => {
    try { await api.post(`/projects/${id}/members`, { user_id: userId, role }); fetchAll() }
    catch (err) { alert(err.response?.data?.error || 'Failed to add member') }
  }

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      await api.post(`/projects/${id}/members`, { user_id: userId, role: newRole })
      fetchAll()
    } catch (err) { alert(err.response?.data?.error || 'Failed to change role') }
  }

  const handleRemoveMember = async userId => {
    if (!confirm('Remove this member?')) return
    try { await api.delete(`/projects/${id}/members/${userId}`); fetchAll() }
    catch (err) { alert(err.response?.data?.error || 'Failed to remove member') }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" style={{ width:32,height:32 }} /></div>
  if (!project) return null

  const members = project.members || []
  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const grouped = { todo: [], inprogress: [], done: [] }
  filteredTasks.forEach(t => grouped[t.status]?.push(t))
  const nonMembers = allUsers.filter(u => !members.find(m => m.id === u.id))

  return (
    <div className="project-detail">
      <button className="back-btn" onClick={() => navigate('/projects')}>
        <ChevronLeft size={16} /> Projects
      </button>

      <div className="project-detail-header">
        <div>
          <h1 style={{ fontSize:26 }}>{project.name}</h1>
          {project.description && <p style={{ color:'var(--text2)', fontSize:14, marginTop:4 }}>{project.description}</p>}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab(activeTab === 'tasks' ? 'members' : 'tasks')}>
            <Users size={15} /> {members.length} Members
          </button>
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}><Plus size={15} /> Add Task</button>}
        </div>
      </div>

      <div className="tabs">
        {['tasks','members'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'tasks' && <span className="tab-count">{tasks.length}</span>}
            {tab === 'members' && <span className="tab-count">{members.length}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {['all', ...STATUSES].map(s => (
              <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="kanban">
            {STATUSES.map(status => (
              <div key={status} className="kanban-col">
                <div className="kanban-col-header">
                  <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
                  <span className="col-count">{grouped[status].length}</span>
                </div>
                <div className="kanban-cards">
                  {grouped[status].length === 0 ? (
                    <div className="kanban-empty">No tasks</div>
                  ) : grouped[status].map(task => (
                    <TaskCard key={task.id} task={task} isAdmin={isAdmin}
                      currentUserId={user?.id}
                      onUpdate={handleUpdateTask} onDelete={handleDeleteTask}
                      members={members} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="members-section">
          <div className="role-info-banner">
            <div className="role-info-item">
              <span className="badge badge-admin">admin</span>
              <span>Can create/edit/delete tasks, manage members, assign anyone</span>
            </div>
            <div className="role-info-item">
              <span className="badge badge-member">member</span>
              <span>Can view assigned tasks and update their status only</span>
            </div>
          </div>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)} style={{ marginBottom:16 }}>
              <UserPlus size={15} /> Add Member
            </button>
          )}
          <div className="members-list">
            {members.map(m => (
              <div key={m.id} className="member-row">
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div className="member-avatar">{m.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight:500 }}>
                      {m.name} {m.id === user?.id && <span style={{ color:'var(--text3)', fontSize:12 }}>(you)</span>}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>{m.email}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  {isAdmin && m.id !== user?.id ? (
                    <select
                      value={m.role}
                      onChange={e => handleChangeRole(m.id, e.target.value)}
                      style={{ padding:'4px 8px', fontSize:12, borderRadius:6, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', cursor:'pointer' }}
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                  )}
                  {isAdmin && m.id !== user?.id && (
                    <button className="icon-btn icon-btn-red" onClick={() => handleRemoveMember(m.id)} title="Remove member"><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>New Task</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskModal(false)}><X size={16} /></button>
            </div>
            {taskError && <div style={{ color:'var(--red)', fontSize:13, marginBottom:12 }}>{taskError}</div>}
            <form onSubmit={handleCreateTask} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm(f => ({...f, title:e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} placeholder="Details..." value={taskForm.description} onChange={e => setTaskForm(f => ({...f, description:e.target.value}))} style={{ resize:'vertical' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({...f, priority:e.target.value}))}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({...f, due_date:e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select value={taskForm.assigned_to} onChange={e => setTaskForm(f => ({...f, assigned_to:e.target.value}))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? <span className="spinner" /> : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMemberModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Add Member</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMemberModal(false)}><X size={16} /></button>
            </div>
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>
              Choose a user and assign their role in this project.
            </p>
            {nonMembers.length === 0 ? (
              <p style={{ color:'var(--text2)', fontSize:14 }}>All registered users are already members.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {nonMembers.map(u => (
                  <AddMemberRow key={u.id} user={u} onAdd={(userId, role) => { handleAddMember(userId, role); setShowMemberModal(false) }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
