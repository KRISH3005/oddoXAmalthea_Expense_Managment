const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getPendingApprovals,
  getApprovalHistory,
  approveExpense,
  rejectExpense,
  getCompanyPendingApprovals
} = require('../controllers/approvalController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/approvals/pending - Get pending approvals for current user
router.get('/pending', getPendingApprovals);

// GET /api/approvals/history - Get approval history for current user
router.get('/history', getApprovalHistory);

// POST /api/approvals/:expenseId/approve - Approve expense
router.post('/:expenseId/approve', approveExpense);

// POST /api/approvals/:expenseId/reject - Reject expense
router.post('/:expenseId/reject', rejectExpense);

// GET /api/approvals/company/pending - Get all pending approvals for company (Admin/Manager view)
router.get('/company/pending', getCompanyPendingApprovals);

module.exports = router;
