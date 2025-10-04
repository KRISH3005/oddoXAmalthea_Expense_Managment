// Free currency API - no API key required
const CURRENCY_API_BASE = 'https://api.exchangerate-api.com/v4/latest';

// Cache for exchange rates (valid for 1 hour)
const rateCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const fetchExchangeRates = async (baseCurrency = 'USD') => {
  const cacheKey = `rates_${baseCurrency}`;
  const cached = rateCache.get(cacheKey);
  
  // Return cached rates if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rates;
  }

  try {
    // Try primary API first
    const response = await fetch(`${CURRENCY_API_BASE}/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error('Primary API failed');
    }
    
    const data = await response.json();
    
    // Cache the rates
    rateCache.set(cacheKey, {
      rates: data.rates,
      timestamp: Date.now()
    });
    
    return data.rates;
  } catch (error) {
    console.warn('Currency API error:', error);
    
    // Return default rates if API fails
    return getDefaultRates(baseCurrency);
  }
};

export const convertCurrency = async (amount, fromCurrency, toCurrency, baseCurrency = 'USD') => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const rates = await fetchExchangeRates(baseCurrency);
    
    let convertedAmount = amount;
    
    // Convert to base currency first if needed
    if (fromCurrency !== baseCurrency) {
      convertedAmount = amount / (rates[fromCurrency] || 1);
    }
    
    // Convert to target currency
    if (toCurrency !== baseCurrency) {
      convertedAmount = convertedAmount * (rates[toCurrency] || 1);
    }
    
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount; // Return original amount if conversion fails
  }
};

export const formatCurrency = (amount, currency, locale = 'en-US') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency is not supported
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const getSupportedCurrencies = () => {
  return [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' }
  ];
};

// Fallback rates if API is unavailable
const getDefaultRates = (baseCurrency) => {
  const defaultRates = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    INR: 83.12,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35,
    CHF: 0.92,
    CNY: 6.45,
    SEK: 8.60,
    NOK: 8.85,
    MXN: 18.5,
    SGD: 1.35,
    HKD: 7.80,
    NZD: 1.48,
    KRW: 1180,
    BRL: 5.20,
    RUB: 75.0,
    ZAR: 15.2,
    TRY: 8.50,
    PLN: 3.90,
    THB: 33.5,
    AED: 3.67,
    SAR: 3.75
  };

  // Adjust rates based on base currency
  if (baseCurrency === 'USD') {
    return defaultRates;
  }

  const baseRate = defaultRates[baseCurrency] || 1;
  const adjustedRates = {};
  
  Object.keys(defaultRates).forEach(currency => {
    adjustedRates[currency] = defaultRates[currency] / baseRate;
  });

  return adjustedRates;
};

export const getCurrencySymbol = (currencyCode) => {
  const currency = getSupportedCurrencies().find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};
