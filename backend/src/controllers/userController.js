const pool = require('../utils/database');
const bcrypt = require('bcryptjs');

// Get all users (Admin only)
const getUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.manager_id,
        u.created_at,
        m.name as manager_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.company_id = $1
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query, [req.user.company_id]);
    
    res.json({
      message: 'Users retrieved successfully',
      users: result.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
};

// Create new user (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, managerId } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(`
      INSERT INTO users (name, email, password, role, manager_id, company_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role, manager_id, created_at
    `, [name, email, hashedPassword, role, managerId || null, req.user.company_id]);

    const user = result.rows[0];

    res.status(201).json({
      message: 'User created successfully',
      user: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, managerId } = req.body;

    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user exists and belongs to same company
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2',
      [id, req.user.company_id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email already exists for different user
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Update user
    const result = await pool.query(`
      UPDATE users 
      SET name = $1, email = $2, role = $3, manager_id = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND company_id = $6
      RETURNING id, name, email, role, manager_id, created_at
    `, [name, email, role, managerId || null, id, req.user.company_id]);

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and belongs to same company
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2',
      [id, req.user.company_id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user has pending expenses or is a manager
    const dependenciesCheck = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM expenses WHERE submitter_id = $1) as expense_count,
        (SELECT COUNT(*) FROM users WHERE manager_id = $1) as managed_users_count
    `, [id]);

    const { expense_count, managed_users_count } = dependenciesCheck.rows[0];

    if (expense_count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with existing expenses' 
      });
    }

    if (managed_users_count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user who is managing other users' 
      });
    }

    // Delete user
    await pool.query(
      'DELETE FROM users WHERE id = $1 AND company_id = $2',
      [id, req.user.company_id]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
