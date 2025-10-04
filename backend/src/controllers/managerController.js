const pool = require('../utils/database');

// Get all users with their manager relationships
const getManagerRelationships = async (req, res) => {
  try {
    const { company_id } = req.user;
    
    const { rows: users } = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.manager_id,
        m.name as manager_name,
        m.email as manager_email
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.company_id = $1
      ORDER BY u.name
    `, [company_id]);
    
    res.json({ users });
  } catch (error) {
    console.error('Get manager relationships error:', error);
    res.status(500).json({ message: 'Failed to get manager relationships' });
  }
};

// Update manager relationship
const updateManagerRelationship = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { userId, managerId } = req.body;
    
    // Validate that both users belong to the same company
    const { rows: users } = await pool.query(`
      SELECT id, name, role FROM users 
      WHERE id IN ($1, $2) AND company_id = $3
    `, [userId, managerId, company_id]);
    
    if (users.length !== 2) {
      return res.status(400).json({ message: 'Invalid users or users not in same company' });
    }
    
    // Check for circular dependency
    if (userId === managerId) {
      return res.status(400).json({ message: 'User cannot be their own manager' });
    }
    
    // Check if setting this manager would create a circular dependency
    const circularCheck = await pool.query(`
      WITH RECURSIVE manager_chain AS (
        SELECT id, manager_id, 1 as level
        FROM users 
        WHERE id = $1
        
        UNION ALL
        
        SELECT u.id, u.manager_id, mc.level + 1
        FROM users u
        JOIN manager_chain mc ON u.id = mc.manager_id
        WHERE mc.level < 10  -- Prevent infinite recursion
      )
      SELECT COUNT(*) as count FROM manager_chain WHERE id = $2
    `, [managerId, userId]);
    
    if (parseInt(circularCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot set manager: would create circular dependency' });
    }
    
    // Update the manager relationship
    await pool.query(`
      UPDATE users 
      SET manager_id = $1 
      WHERE id = $2 AND company_id = $3
    `, [managerId, userId, company_id]);
    
    res.json({ message: 'Manager relationship updated successfully' });
  } catch (error) {
    console.error('Update manager relationship error:', error);
    res.status(500).json({ message: 'Failed to update manager relationship' });
  }
};

// Remove manager relationship
const removeManagerRelationship = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { userId } = req.params;
    
    // Check if user belongs to company
    const { rows: user } = await pool.query(`
      SELECT id FROM users WHERE id = $1 AND company_id = $2
    `, [userId, company_id]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove manager relationship
    await pool.query(`
      UPDATE users 
      SET manager_id = NULL 
      WHERE id = $1 AND company_id = $2
    `, [userId, company_id]);
    
    res.json({ message: 'Manager relationship removed successfully' });
  } catch (error) {
    console.error('Remove manager relationship error:', error);
    res.status(500).json({ message: 'Failed to remove manager relationship' });
  }
};

// Get available managers for a user (excludes the user themselves and their subordinates)
const getAvailableManagers = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { userId } = req.params;
    
    // Get users who can be managers (Admin, Manager, CFO roles)
    const { rows: managers } = await pool.query(`
      SELECT id, name, email, role
      FROM users 
      WHERE company_id = $1 
      AND role IN ('Admin', 'Manager', 'CFO')
      AND id != $2
      ORDER BY name
    `, [company_id, userId]);
    
    res.json({ managers });
  } catch (error) {
    console.error('Get available managers error:', error);
    res.status(500).json({ message: 'Failed to get available managers' });
  }
};

// Get organizational chart
const getOrganizationalChart = async (req, res) => {
  try {
    const { company_id } = req.user;
    
    const { rows: users } = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.manager_id,
        m.name as manager_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.company_id = $1
      ORDER BY u.role, u.name
    `, [company_id]);
    
    // Build hierarchical structure
    const buildHierarchy = (users, managerId = null) => {
      return users
        .filter(user => user.manager_id === managerId)
        .map(user => ({
          ...user,
          subordinates: buildHierarchy(users, user.id)
        }));
    };
    
    const hierarchy = buildHierarchy(users);
    
    res.json({ hierarchy, users });
  } catch (error) {
    console.error('Get organizational chart error:', error);
    res.status(500).json({ message: 'Failed to get organizational chart' });
  }
};

module.exports = {
  getManagerRelationships,
  updateManagerRelationship,
  removeManagerRelationship,
  getAvailableManagers,
  getOrganizationalChart
};
