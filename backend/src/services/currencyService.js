const axios = require('axios');

// Cache for currency rates (refresh every hour)
let currencyRatesCache = {
  data: null,
  lastUpdated: null,
  baseCurrency: null
};

// Cache for countries data (refresh daily)
let countriesCache = {
  data: null,
  lastUpdated: null
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour for currency rates
const COUNTRIES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for countries

// Get all countries with their currencies
const getCountries = async () => {
  try {
    const now = Date.now();
    
    // Check if we have cached data and it's still valid
    if (countriesCache.data && countriesCache.lastUpdated && 
        (now - countriesCache.lastUpdated) < COUNTRIES_CACHE_DURATION) {
      return countriesCache.data;
    }

    console.log('Fetching countries data from API...');
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    
    const countries = response.data.map(country => ({
      name: country.name.common,
      code: country.name.common.toLowerCase().replace(/\s+/g, '-'),
      currencies: Object.keys(country.currencies || {}).map(code => ({
        code: code,
        name: country.currencies[code].name,
        symbol: country.currencies[code].symbol
      }))
    })).sort((a, b) => a.name.localeCompare(b.name));

    countriesCache.data = countries;
    countriesCache.lastUpdated = now;
    
    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw new Error('Failed to fetch countries data');
  }
};

// Get currency exchange rates
const getCurrencyRates = async (baseCurrency = 'USD') => {
  try {
    const now = Date.now();
    
    // Check if we have cached data and it's still valid
    if (currencyRatesCache.data && currencyRatesCache.lastUpdated && 
        currencyRatesCache.baseCurrency === baseCurrency &&
        (now - currencyRatesCache.lastUpdated) < CACHE_DURATION) {
      return currencyRatesCache.data;
    }

    console.log(`Fetching currency rates for base currency: ${baseCurrency}`);
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    currencyRatesCache.data = response.data;
    currencyRatesCache.lastUpdated = now;
    currencyRatesCache.baseCurrency = baseCurrency;
    
    return response.data;
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    throw new Error('Failed to fetch currency rates');
  }
};

// Convert amount from one currency to another
const convertCurrency = async (amount, fromCurrency, toCurrency, baseCurrency = 'USD') => {
  try {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await getCurrencyRates(baseCurrency);
    
    // Convert to base currency first, then to target currency
    let amountInBase = amount;
    if (fromCurrency !== baseCurrency) {
      const fromRate = rates.rates[fromCurrency];
      if (!fromRate) {
        throw new Error(`Currency ${fromCurrency} not supported`);
      }
      amountInBase = amount / fromRate;
    }

    let convertedAmount = amountInBase;
    if (toCurrency !== baseCurrency) {
      const toRate = rates.rates[toCurrency];
      if (!toRate) {
        throw new Error(`Currency ${toCurrency} not supported`);
      }
      convertedAmount = amountInBase * toRate;
    }

    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error converting currency:', error);
    throw new Error(`Failed to convert ${fromCurrency} to ${toCurrency}`);
  }
};

// Get popular currencies
const getPopularCurrencies = () => {
  return [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج' }
  ];
};

// Format currency amount
const formatCurrency = (amount, currencyCode, locale = 'en-US') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

module.exports = {
  getCountries,
  getCurrencyRates,
  convertCurrency,
  getPopularCurrencies,
  formatCurrency
};
