const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getManagerRelationships,
  updateManagerRelationship,
  removeManagerRelationship,
  getAvailableManagers,
  getOrganizationalChart
} = require('../controllers/managerController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// All routes require Admin role
router.use(requireRole(['Admin']));

// GET /api/managers - Get all manager relationships
router.get('/', getManagerRelationships);

// GET /api/managers/chart - Get organizational chart
router.get('/chart', getOrganizationalChart);

// GET /api/managers/available/:userId - Get available managers for a user
router.get('/available/:userId', getAvailableManagers);

// PUT /api/managers - Update manager relationship
router.put('/', updateManagerRelationship);

// DELETE /api/managers/:userId - Remove manager relationship
router.delete('/:userId', removeManagerRelationship);

module.exports = router;
