const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getApprovalRules,
  createApprovalRule,
  updateApprovalRule,
  deleteApprovalRule,
  getAvailableRoles,
  reorderApprovalRules
} = require('../controllers/approvalRulesController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// All routes require Admin or CFO role
router.use(requireRole(['Admin', 'CFO']));

// GET /api/approval-rules - Get all approval rules for company
router.get('/', getApprovalRules);

// GET /api/approval-rules/roles - Get available roles for approval rules
router.get('/roles', getAvailableRoles);

// POST /api/approval-rules - Create a new approval rule
router.post('/', createApprovalRule);

// PUT /api/approval-rules/:ruleId - Update an approval rule
router.put('/:ruleId', updateApprovalRule);

// DELETE /api/approval-rules/:ruleId - Delete an approval rule
router.delete('/:ruleId', deleteApprovalRule);

// PUT /api/approval-rules/reorder - Reorder approval rules
router.put('/reorder', reorderApprovalRules);

module.exports = router;
