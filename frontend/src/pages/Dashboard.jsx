import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { CheckCircle2, Clock, CircleDot, AlertTriangle, LayoutGrid, ArrowRight } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import './Dashboard.css'

const statusLabels = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' }
const priorityColors = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/tasks/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" style={{ width:32,height:32 }} /></div>

  const { total = 0, byStatus = {}, byUser = [], overdue = 0, recentTasks = [] } = data || {}
  const done = byStatus.done || 0
  const inprogress = byStatus.inprogress || 0
  const todo = byStatus.todo || 0
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Welcome back, {user?.name} 👋</p>
        </div>
        <Link to="/projects" className="btn btn-primary btn-sm">
          <LayoutGrid size={15} /> View Projects
        </Link>
      </div>

      <div className="stat-grid">
        <StatCard icon={<LayoutGrid size={20} />} label="Total Tasks" value={total} color="var(--accent)" />
        <StatCard icon={<CircleDot size={20} />} label="To Do" value={todo} color="var(--text2)" />
        <StatCard icon={<Clock size={20} />} label="In Progress" value={inprogress} color="var(--blue)" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Done" value={done} color="var(--green)" />
        <StatCard icon={<AlertTriangle size={20} />} label="Overdue" value={overdue} color="var(--red)" />
      </div>

      <div className="dashboard-grid">
        <div className="card progress-card">
          <h3 className="section-title">Overall Progress</h3>
          <div className="progress-wrap">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="progress-pct">{pct}%</span>
          </div>
          <div className="status-breakdown">
            {[
              { key: 'todo', label: 'To Do', val: todo, color: 'var(--text3)' },
              { key: 'inprogress', label: 'In Progress', val: inprogress, color: 'var(--blue)' },
              { key: 'done', label: 'Done', val: done, color: 'var(--green)' },
            ].map(s => (
              <div key={s.key} className="status-row">
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:s.color, display:'inline-block' }} />
                  {s.label}
                </span>
                <span style={{ fontWeight: 600 }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Tasks per Member</h3>
          {byUser.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>No task assignments yet</p>
            </div>
          ) : (
            <div className="user-task-list">
              {byUser.map(u => (
                <div key={u.id} className="user-task-row">
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div className="mini-avatar">{u.name?.[0]?.toUpperCase()}</div>
                    <span style={{ fontSize:14 }}>{u.name}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div className="user-bar-bg">
                      <div className="user-bar-fill" style={{ width: `${Math.min((u.task_count / Math.max(...byUser.map(x=>x.task_count))) * 100, 100)}%` }} />
                    </div>
                    <span style={{ fontSize:13, color:'var(--text2)', minWidth:16 }}>{u.task_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card recent-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 className="section-title" style={{ marginBottom:0 }}>Recent Activity</h3>
            <Link to="/projects" style={{ color:'var(--accent2)', fontSize:13, display:'flex', alignItems:'center', gap:4 }}>
              All Projects <ArrowRight size={14} />
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>No tasks yet</p>
            </div>
          ) : (
            <div className="recent-tasks">
              {recentTasks.map(task => {
                const due = task.due_date ? parseISO(task.due_date) : null
                const isOverdue = due && isValid(due) && due < new Date() && task.status !== 'done'
                return (
                  <div key={task.id} className="recent-task-row">
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:500, fontSize:14, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{task.title}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{task.project_name}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                      <span className={`badge badge-${task.status}`}>{statusLabels[task.status]}</span>
                      {due && isValid(due) && (
                        <span style={{ fontSize:11, color: isOverdue ? 'var(--red)' : 'var(--text3)' }}>
                          {format(due, 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
