const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCountries,
  getCurrencyRates,
  convertCurrency,
  getPopularCurrencies,
  formatCurrency
} = require('../controllers/currencyController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/currency/countries - Get all countries with currencies
router.get('/countries', getCountries);

// GET /api/currency/rates - Get currency exchange rates
router.get('/rates', getCurrencyRates);

// GET /api/currency/popular - Get popular currencies
router.get('/popular', getPopularCurrencies);

// POST /api/currency/convert - Convert currency
router.post('/convert', convertCurrency);

// POST /api/currency/format - Format currency amount
router.post('/format', formatCurrency);

module.exports = router;
