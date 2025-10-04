const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTables = async () => {
  try {
    console.log('🔄 Creating database tables...');

    // Companies table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        base_currency VARCHAR(3) DEFAULT 'USD',
        country VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Companies table created');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Employee',
        company_id INTEGER REFERENCES companies(id),
        manager_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        converted_amount DECIMAL(10,2),
        category VARCHAR(100) NOT NULL,
        expense_date DATE NOT NULL,
        receipt_url TEXT,
        approval_status VARCHAR(50) DEFAULT 'pending',
        submitter_id INTEGER REFERENCES users(id),
        company_id INTEGER REFERENCES companies(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Expenses table created');

    // Approval Rules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS approval_rules (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id),
        step_order INTEGER NOT NULL,
        rule_type VARCHAR(50) NOT NULL,
        special_role VARCHAR(100),
        threshold INTEGER DEFAULT 50,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Approval Rules table created');

    // Approval Steps table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS approval_steps (
        id SERIAL PRIMARY KEY,
        expense_id INTEGER REFERENCES expenses(id),
        step_order INTEGER NOT NULL,
        approver_id INTEGER REFERENCES users(id),
        role VARCHAR(100),
        is_current BOOLEAN DEFAULT FALSE,
        approved_at TIMESTAMP,
        rejected_at TIMESTAMP,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Approval Steps table created');

    // Expense Approvers table (for percentage-based approvals)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_approvers (
        id SERIAL PRIMARY KEY,
        expense_id INTEGER REFERENCES expenses(id),
        step_id INTEGER REFERENCES approval_steps(id),
        approver_id INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Expense Approvers table created');

    // Legacy Approvals table (keeping for backward compatibility)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS approvals (
        id SERIAL PRIMARY KEY,
        expense_id INTEGER REFERENCES expenses(id),
        approver_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'Pending',
        comments TEXT,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Legacy Approvals table created');

    console.log('🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  }
};

// Test connection and create tables
const initDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    console.log('📊 Database:', client.database);
    client.release();
    
    await createTables();
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
};

initDatabase();
module.exports = pool;
