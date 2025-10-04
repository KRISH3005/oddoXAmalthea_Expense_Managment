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

// GET /api/approvals/company/pending - Get all pending approvals for company (Admin/Manager view)
router.get('/company/pending', getCompanyPendingApprovals);

// POST /api/approvals/:expenseId/approve - Approve expense
router.post('/:expenseId/approve', (req, res, next) => {
  console.log('=== APPROVE ROUTE HIT ===');
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('========================');
  next();
}, approveExpense);

// POST /api/approvals/:expenseId/reject - Reject expense
router.post('/:expenseId/reject', (req, res, next) => {
  console.log('=== REJECT ROUTE HIT ===');
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('========================');
  next();
}, rejectExpense);

module.exports = router;
