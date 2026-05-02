const { db } = require('../config/database');

function createProject(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const result = db.prepare('INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)').run(name, description || '', req.user.id);
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, req.user.id, 'admin');

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getProjects(req, res) {
  try {
    const projects = db.prepare(`
      SELECT p.*, pm.role as user_role,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        u.name as creator_name
      FROM projects p
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
      JOIN users u ON u.id = p.created_by
      ORDER BY p.created_at DESC
    `).all(req.user.id);
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getProject(req, res) {
  try {
    const { id } = req.params;
    const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const project = db.prepare(`
      SELECT p.*, u.name as creator_name
      FROM projects p JOIN users u ON u.id = p.created_by
      WHERE p.id = ?
    `).get(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, pm.role, pm.joined_at
      FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = ? ORDER BY pm.role DESC, u.name
    `).all(id);

    res.json({ project: { ...project, members, user_role: member.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function addMember(req, res) {
  try {
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;

    const requester = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(id, req.user.id);
    if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Only admins can add members' });

    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(id, user_id);
    if (existing) return res.status(409).json({ error: 'User is already a member' });

    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(id, user_id, role);
    res.json({ message: 'Member added', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function removeMember(req, res) {
  try {
    const { id, userId } = req.params;
    const requester = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(id, req.user.id);
    if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Only admins can remove members' });
    if (parseInt(userId) === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself' });

    db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(id, userId);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const requester = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(id, req.user.id);
    if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Only admins can delete projects' });
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createProject, getProjects, getProject, addMember, removeMember, deleteProject };
