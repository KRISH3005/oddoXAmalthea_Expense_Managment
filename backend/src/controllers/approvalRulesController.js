const pool = require('../utils/database');

// Get all approval rules for a company
const getApprovalRules = async (req, res) => {
  try {
    const { company_id } = req.user;
    
    const { rows: rules } = await pool.query(`
      SELECT * FROM approval_rules 
      WHERE company_id = $1 
      ORDER BY step_order ASC
    `, [company_id]);
    
    res.json({ rules });
  } catch (error) {
    console.error('Get approval rules error:', error);
    res.status(500).json({ message: 'Failed to get approval rules' });
  }
};

// Create a new approval rule
const createApprovalRule = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { step_order, rule_type, special_role, threshold, is_manager_approver = false, active = true } = req.body;
    
    // Validate required fields
    if (!step_order || !rule_type || !special_role) {
      return res.status(400).json({ 
        message: 'step_order, rule_type, and special_role are required' 
      });
    }
    
    // Validate rule_type
    if (!['specific', 'percentage', 'hybrid'].includes(rule_type)) {
      return res.status(400).json({ 
        message: 'rule_type must be specific, percentage, or hybrid' 
      });
    }
    
    // Validate threshold for percentage and hybrid rules
    if ((rule_type === 'percentage' || rule_type === 'hybrid') && (!threshold || threshold < 1 || threshold > 100)) {
      return res.status(400).json({ 
        message: 'threshold must be between 1 and 100 for percentage/hybrid rules' 
      });
    }
    
    const { rows: [rule] } = await pool.query(`
      INSERT INTO approval_rules (company_id, step_order, rule_type, special_role, threshold, is_manager_approver, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [company_id, step_order, rule_type, special_role, threshold || 50, is_manager_approver, active]);
    
    res.status(201).json({ rule });
  } catch (error) {
    console.error('Create approval rule error:', error);
    res.status(500).json({ message: 'Failed to create approval rule' });
  }
};

// Update an approval rule
const updateApprovalRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const { company_id } = req.user;
    const { step_order, rule_type, special_role, threshold, is_manager_approver, active } = req.body;
    
    // Check if rule exists and belongs to company
    const { rows: [existingRule] } = await pool.query(`
      SELECT * FROM approval_rules WHERE id = $1 AND company_id = $2
    `, [ruleId, company_id]);
    
    if (!existingRule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }
    
    // Validate rule_type if provided
    if (rule_type && !['specific', 'percentage', 'hybrid'].includes(rule_type)) {
      return res.status(400).json({ 
        message: 'rule_type must be specific, percentage, or hybrid' 
      });
    }
    
    // Validate threshold for percentage and hybrid rules
    if ((rule_type === 'percentage' || rule_type === 'hybrid') && threshold && (threshold < 1 || threshold > 100)) {
      return res.status(400).json({ 
        message: 'threshold must be between 1 and 100 for percentage/hybrid rules' 
      });
    }
    
    const { rows: [rule] } = await pool.query(`
      UPDATE approval_rules 
      SET step_order = COALESCE($1, step_order),
          rule_type = COALESCE($2, rule_type),
          special_role = COALESCE($3, special_role),
          threshold = COALESCE($4, threshold),
          is_manager_approver = COALESCE($5, is_manager_approver),
          active = COALESCE($6, active)
      WHERE id = $7 AND company_id = $8
      RETURNING *
    `, [step_order, rule_type, special_role, threshold, is_manager_approver, active, ruleId, company_id]);
    
    res.json({ rule });
  } catch (error) {
    console.error('Update approval rule error:', error);
    res.status(500).json({ message: 'Failed to update approval rule' });
  }
};

// Delete an approval rule
const deleteApprovalRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const { company_id } = req.user;
    
    // Check if rule exists and belongs to company
    const { rows: [existingRule] } = await pool.query(`
      SELECT * FROM approval_rules WHERE id = $1 AND company_id = $2
    `, [ruleId, company_id]);
    
    if (!existingRule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }
    
    await pool.query(`
      DELETE FROM approval_rules WHERE id = $1 AND company_id = $2
    `, [ruleId, company_id]);
    
    res.json({ message: 'Approval rule deleted successfully' });
  } catch (error) {
    console.error('Delete approval rule error:', error);
    res.status(500).json({ message: 'Failed to delete approval rule' });
  }
};

// Get available roles for approval rules
const getAvailableRoles = async (req, res) => {
  try {
    const { company_id } = req.user;
    
    const { rows: roles } = await pool.query(`
      SELECT DISTINCT role FROM users 
      WHERE company_id = $1 AND role IS NOT NULL
      ORDER BY role
    `, [company_id]);
    
    res.json({ roles: roles.map(r => r.role) });
  } catch (error) {
    console.error('Get available roles error:', error);
    res.status(500).json({ message: 'Failed to get available roles' });
  }
};

// Reorder approval rules
const reorderApprovalRules = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { rules } = req.body; // Array of {id, step_order}
    
    if (!Array.isArray(rules)) {
      return res.status(400).json({ message: 'rules must be an array' });
    }
    
    await pool.query('BEGIN');
    
    for (const rule of rules) {
      await pool.query(`
        UPDATE approval_rules 
        SET step_order = $1 
        WHERE id = $2 AND company_id = $3
      `, [rule.step_order, rule.id, company_id]);
    }
    
    await pool.query('COMMIT');
    
    // Return updated rules
    const { rows: updatedRules } = await pool.query(`
      SELECT * FROM approval_rules 
      WHERE company_id = $1 
      ORDER BY step_order ASC
    `, [company_id]);
    
    res.json({ rules: updatedRules });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Reorder approval rules error:', error);
    res.status(500).json({ message: 'Failed to reorder approval rules' });
  }
};

module.exports = {
  getApprovalRules,
  createApprovalRule,
  updateApprovalRule,
  deleteApprovalRule,
  getAvailableRoles,
  reorderApprovalRules
};
