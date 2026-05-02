const express = require('express');
const router = express.Router();
const { signup, login, me, getAllUsers } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticate, me);
router.get('/users', authenticate, getAllUsers);

module.exports = router;
