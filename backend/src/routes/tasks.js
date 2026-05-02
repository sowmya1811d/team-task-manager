const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createTask, getProjectTasks, updateTask, deleteTask, getDashboard } = require('../controllers/taskController');

router.use(authenticate);
router.get('/dashboard', getDashboard);
router.post('/', createTask);
router.get('/project/:projectId', getProjectTasks);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
