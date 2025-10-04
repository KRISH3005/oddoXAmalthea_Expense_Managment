const express = require('express');
const { getCompany, updateCompany } = require('../controllers/companyController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// GET /api/company - Get company details
router.get('/', getCompany);

// PUT /api/company - Update company details (Admin only)
router.put('/', requireRole(['Admin']), updateCompany);

module.exports = router;
