const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
require('./src/utils/database');

const app = express();
const PORT = process.env.PORT || 3001; // Using 3001 as it works

// CORS Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',  // Frontend Vite
    'http://localhost:3000',  // Alternative frontend
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple test route
app.get('/', (req, res) => {
  res.json({
    message: '✅ ExpenseTracker API v1.0.0',
    status: 'success',
    timestamp: new Date().toISOString(),
    port: PORT,
    endpoints: {
      auth: '/api/auth/*',
      expenses: '/api/expenses/*',
      users: '/api/users/*',
      approvals: '/api/approvals/*',
      company: '/api/company/*',
      approvalRules: '/api/approval-rules/*',
      managers: '/api/managers/*',
      currency: '/api/currency/*'
    }
  });
});

// API Routes with error handling
try {
  app.use('/api/auth', require('./src/routes/auth'));
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Auth routes failed:', error.message);
}

try {
  app.use('/api/expenses', require('./src/routes/expenses'));
  console.log('✅ Expenses routes loaded');
} catch (error) {
  console.error('❌ Expenses routes failed:', error.message);
}

try {
  app.use('/api/users', require('./src/routes/users'));
  console.log('✅ Users routes loaded');
} catch (error) {
  console.error('❌ Users routes failed:', error.message);
}

try {
  app.use('/api/approvals', require('./src/routes/approvals'));
  console.log('✅ Approvals routes loaded');
} catch (error) {
  console.error('❌ Approvals routes failed:', error.message);
}

try {
  app.use('/api/company', require('./src/routes/company'));
  console.log('✅ Company routes loaded');
} catch (error) {
  console.error('❌ Company routes failed:', error.message);
}

try {
  app.use('/api/approval-rules', require('./src/routes/approvalRules'));
  console.log('✅ Approval Rules routes loaded');
} catch (error) {
  console.error('❌ Approval Rules routes failed:', error.message);
}

try {
  app.use('/api/managers', require('./src/routes/managers'));
  console.log('✅ Manager routes loaded');
} catch (error) {
  console.error('❌ Manager routes failed:', error.message);
}

try {
  app.use('/api/currency', require('./src/routes/currency'));
  console.log('✅ Currency routes loaded');
} catch (error) {
  console.error('❌ Currency routes failed:', error.message);
}

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    message: 'The requested API endpoint does not exist'
  });
});


// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for everything else
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
    method: req.method,
    suggestion: 'Try visiting /api/auth, /api/expenses, /api/users, /api/approvals, or /api/company'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ExpenseTracker API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: http://localhost:5173`);
  console.log(`📋 API Documentation: http://localhost:${PORT}`);
  console.log(`🎯 Database: PostgreSQL connected`);
});

module.exports = app;
