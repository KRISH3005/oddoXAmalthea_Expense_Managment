const currencyService = require('../services/currencyService');

// Get all countries with currencies
const getCountries = async (req, res) => {
  try {
    const countries = await currencyService.getCountries();
    res.json({ countries });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ message: 'Failed to fetch countries' });
  }
};

// Get currency exchange rates
const getCurrencyRates = async (req, res) => {
  try {
    const { base = 'USD' } = req.query;
    const rates = await currencyService.getCurrencyRates(base);
    res.json(rates);
  } catch (error) {
    console.error('Get currency rates error:', error);
    res.status(500).json({ message: 'Failed to fetch currency rates' });
  }
};

// Convert currency
const convertCurrency = async (req, res) => {
  try {
    const { amount, from, to, base = 'USD' } = req.body;
    
    if (!amount || !from || !to) {
      return res.status(400).json({ 
        message: 'Amount, from currency, and to currency are required' 
      });
    }

    const convertedAmount = await currencyService.convertCurrency(amount, from, to, base);
    
    res.json({
      originalAmount: amount,
      fromCurrency: from,
      toCurrency: to,
      convertedAmount: convertedAmount,
      formattedAmount: currencyService.formatCurrency(convertedAmount, to)
    });
  } catch (error) {
    console.error('Convert currency error:', error);
    res.status(500).json({ message: error.message || 'Failed to convert currency' });
  }
};

// Get popular currencies
const getPopularCurrencies = async (req, res) => {
  try {
    const currencies = currencyService.getPopularCurrencies();
    res.json({ currencies });
  } catch (error) {
    console.error('Get popular currencies error:', error);
    res.status(500).json({ message: 'Failed to fetch popular currencies' });
  }
};

// Format currency amount
const formatCurrency = async (req, res) => {
  try {
    const { amount, currency, locale = 'en-US' } = req.body;
    
    if (!amount || !currency) {
      return res.status(400).json({ 
        message: 'Amount and currency are required' 
      });
    }

    const formatted = currencyService.formatCurrency(amount, currency, locale);
    
    res.json({
      amount: amount,
      currency: currency,
      formatted: formatted
    });
  } catch (error) {
    console.error('Format currency error:', error);
    res.status(500).json({ message: 'Failed to format currency' });
  }
};

module.exports = {
  getCountries,
  getCurrencyRates,
  convertCurrency,
  getPopularCurrencies,
  formatCurrency
};
