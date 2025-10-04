const express = require('express');
const { signup, login, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup - Create new company and admin user
router.post('/signup', signup);

// POST /api/auth/login - Login user
router.post('/login', login);

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticateToken, getCurrentUser);

// POST /api/auth/logout - Logout (client handles token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
