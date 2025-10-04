const jwt = require('jsonwebtoken');
const pool = require('../utils/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userResult = await pool.query(
      'SELECT u.*, c.name as company_name, c.base_currency FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.id = $1', 
      [decoded.userId || decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ message: 'User not found' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  next();
};

module.exports = { authenticateToken, requireRole };
