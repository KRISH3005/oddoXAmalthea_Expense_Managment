const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../utils/database');

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
};

// SIGNUP - Create new company and admin user
const signup = async (req, res) => {
  const { name, email, password, companyName, country, baseCurrency } = req.body;

  if (!name || !email || !password || !companyName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create company
    const companyResult = await client.query(`
      INSERT INTO companies (name, country, base_currency) 
      VALUES ($1, $2, $3) 
      RETURNING id, name, base_currency
    `, [companyName, country || 'Unknown', baseCurrency || 'USD']);

    const company = companyResult.rows[0];

    // Create admin user
    const userResult = await client.query(`
      INSERT INTO users (name, email, password, role, company_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, name, email, role, company_id
    `, [name, email, hashedPassword, 'Admin', company.id]);

    const user = userResult.rows[0];

    await client.query('COMMIT');

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Company and admin user created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      company: {
        id: company.id,
        name: company.name,
        baseCurrency: company.base_currency
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

// LOGIN - Authenticate user
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Get user with company details
    const result = await pool.query(`
      SELECT u.*, c.name as company_name, c.base_currency 
      FROM users u 
      LEFT JOIN companies c ON u.company_id = c.id 
      WHERE u.email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      company: {
        id: user.company_id,
        name: user.company_name,
        baseCurrency: user.base_currency
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET CURRENT USER - Get user info from token
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      company: {
        id: user.company_id,
        name: user.company_name,
        baseCurrency: user.base_currency
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { signup, login, getCurrentUser };
