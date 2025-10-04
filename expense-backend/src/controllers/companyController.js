const pool = require('../utils/database');

// Get company details
const getCompany = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    const result = await pool.query(`
      SELECT id, name, base_currency, country, created_at 
      FROM companies 
      WHERE id = $1
    `, [companyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({
      message: 'Company retrieved successfully',
      company: result.rows[0]
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Failed to retrieve company' });
  }
};

// Update company details (Admin only)
const updateCompany = async (req, res) => {
  try {
    const { name, baseCurrency, country } = req.body;
    const companyId = req.user.company_id;
    
    if (!name || !baseCurrency) {
      return res.status(400).json({ message: 'Name and base currency are required' });
    }
    
    const result = await pool.query(`
      UPDATE companies 
      SET name = $1, base_currency = $2, country = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, base_currency, country, created_at
    `, [name, baseCurrency, country || null, companyId]);
    
    res.json({
      message: 'Company updated successfully',
      company: result.rows[0]
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Failed to update company' });
  }
};

module.exports = {
  getCompany,
  updateCompany
};