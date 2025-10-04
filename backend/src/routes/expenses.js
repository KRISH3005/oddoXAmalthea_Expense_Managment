const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../utils/database');
const { initializeApprovalWorkflow } = require('../controllers/expenseController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// GET /api/expenses - Get user's expenses
router.get('/', async (req, res) => {
  try {
    const { status, category, startDate, endDate } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT e.*, u.name as submitter_name,
             COALESCE(e.approval_status, 'pending') as approval_status
      FROM expenses e
      LEFT JOIN users u ON e.submitter_id = u.id
      WHERE e.submitter_id = $1
    `;

    let params = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND e.approval_status = $${paramCount}`;
      params.push(status);
    }

    if (category) {
      paramCount++;
      query += ` AND e.category = $${paramCount}`;
      params.push(category);
    }

    if (startDate) {
      paramCount++;
      query += ` AND e.expense_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND e.expense_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ expenses: result.rows });

  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses - Create new expense
router.post('/', async (req, res) => {
  try {
    const { description, amount, currency, convertedAmount, category, expenseDate, receiptUrl } = req.body;
    const submitterId = req.user.id;
    const companyId = req.user.company_id;

    if (!description || !amount || !currency || !category || !expenseDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create expense
    const result = await pool.query(`
      INSERT INTO expenses (description, amount, currency, converted_amount, category, expense_date, receipt_url, submitter_id, company_id, approval_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `, [description, amount, currency, convertedAmount || amount, category, expenseDate, receiptUrl, submitterId, companyId]);

    const expense = result.rows[0];

    // Initialize approval workflow
    try {
      await initializeApprovalWorkflow(expense.id, companyId);
    } catch (workflowError) {
      console.error('Workflow initialization error:', workflowError);
      // Don't fail the expense creation if workflow fails
    }

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });

  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, currency, convertedAmount, category, expenseDate } = req.body;
    const userId = req.user.id;

    const result = await pool.query(`
      UPDATE expenses
      SET description = $1, amount = $2, currency = $3, converted_amount = $4,
          category = $5, expense_date = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND submitter_id = $8 AND approval_status IN ('pending', 'rejected')
      RETURNING *
    `, [description, amount, currency, convertedAmount, category, expenseDate, id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found or cannot be updated' });
    }

    res.json({
      message: 'Expense updated successfully',
      expense: result.rows[0]
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(`
      DELETE FROM expenses
      WHERE id = $1 AND submitter_id = $2 AND approval_status IN ('pending', 'rejected')
      RETURNING id
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found or cannot be deleted' });
    }

    res.json({ message: 'Expense deleted successfully' });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});

// POST /api/expenses/:id/receipt - Upload receipt
router.post('/:id/receipt', upload.single('receipt'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const receiptUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(`
      UPDATE expenses
      SET receipt_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND submitter_id = $3
      RETURNING *
    `, [receiptUrl, id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({
      message: 'Receipt uploaded successfully',
      receiptUrl
    });

  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({ message: 'Failed to upload receipt' });
  }
});

module.exports = router;
