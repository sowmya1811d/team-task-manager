const { db } = require('../config/database');

function getMembership(projectId, userId) {
  return db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
}

function createTask(req, res) {
  try {
    const { project_id, title, description, priority, due_date, assigned_to } = req.body;
    if (!project_id || !title) return res.status(400).json({ error: 'project_id and title are required' });

    const member = getMembership(project_id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });
    if (member.role !== 'admin') return res.status(403).json({ error: 'Only admins can create tasks' });

    if (assigned_to) {
      const assigneeMember = getMembership(project_id, assigned_to);
      if (!assigneeMember) return res.status(400).json({ error: 'Assigned user is not a project member' });
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description, priority, due_date, project_id, assigned_to, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'todo')
    `).run(title, description || '', priority || 'medium', due_date || null, project_id, assigned_to || null, req.user.id);

    const task = db.prepare(`
      SELECT t.*, u.name as assigned_name, u2.name as creator_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users u2 ON u2.id = t.created_by
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getProjectTasks(req, res) {
  try {
    const { projectId } = req.params;
    const member = getMembership(projectId, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    let tasks;
    if (member.role === 'admin') {
      tasks = db.prepare(`
        SELECT t.*, u.name as assigned_name, u2.name as creator_name
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        LEFT JOIN users u2 ON u2.id = t.created_by
        WHERE t.project_id = ? ORDER BY t.created_at DESC
      `).all(projectId);
    } else {
      tasks = db.prepare(`
        SELECT t.*, u.name as assigned_name, u2.name as creator_name
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        LEFT JOIN users u2 ON u2.id = t.created_by
        WHERE t.project_id = ? AND t.assigned_to = ? ORDER BY t.created_at DESC
      `).all(projectId, req.user.id);
    }

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function updateTask(req, res) {
  try {
    const { id } = req.params;
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = getMembership(task.project_id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const { title, description, status, priority, due_date, assigned_to } = req.body;

    if (member.role === 'member') {
      if (task.assigned_to !== req.user.id) return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      if (title || description || priority || due_date || assigned_to)
        return res.status(403).json({ error: 'Members can only update task status' });
    }

    const updates = {
      title: title ?? task.title,
      description: description ?? task.description,
      status: status ?? task.status,
      priority: priority ?? task.priority,
      due_date: due_date !== undefined ? due_date : task.due_date,
      assigned_to: assigned_to !== undefined ? assigned_to : task.assigned_to,
    };

    db.prepare(`
      UPDATE tasks SET title=?, description=?, status=?, priority=?, due_date=?, assigned_to=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(updates.title, updates.description, updates.status, updates.priority, updates.due_date, updates.assigned_to, id);

    const updated = db.prepare(`
      SELECT t.*, u.name as assigned_name, u2.name as creator_name
      FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN users u2 ON u2.id = t.created_by
      WHERE t.id = ?
    `).get(id);
    res.json({ task: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = getMembership(task.project_id, req.user.id);
    if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Only admins can delete tasks' });

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getDashboard(req, res) {
  try {
    const userId = req.user.id;

    const projectIds = db.prepare('SELECT project_id FROM project_members WHERE user_id = ?').all(userId).map(r => r.project_id);
    if (!projectIds.length) return res.json({ total: 0, byStatus: {}, byUser: [], overdue: 0, recentTasks: [] });

    const placeholders = projectIds.map(() => '?').join(',');

    const total = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders})`).get(...projectIds).count;
    const byStatus = db.prepare(`SELECT status, COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) GROUP BY status`).all(...projectIds);
    const byUser = db.prepare(`
      SELECT u.name, u.id, COUNT(t.id) as task_count
      FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.project_id IN (${placeholders}) AND t.assigned_to IS NOT NULL
      GROUP BY t.assigned_to ORDER BY task_count DESC LIMIT 10
    `).all(...projectIds);
    const overdue = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE project_id IN (${placeholders}) AND due_date < date('now') AND status != 'done'
    `).get(...projectIds).count;
    const recentTasks = db.prepare(`
      SELECT t.*, u.name as assigned_name, p.name as project_name
      FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to JOIN projects p ON p.id = t.project_id
      WHERE t.project_id IN (${placeholders}) ORDER BY t.updated_at DESC LIMIT 5
    `).all(...projectIds);

    const statusMap = {};
    byStatus.forEach(r => { statusMap[r.status] = r.count; });

    res.json({ total, byStatus: statusMap, byUser, overdue, recentTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createTask, getProjectTasks, updateTask, deleteTask, getDashboard };
