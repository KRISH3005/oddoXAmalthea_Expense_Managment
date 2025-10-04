// Using the APIs you specified
export const getCountriesWithCurrencies = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
      const countries = await response.json();
      
      return countries
        .filter(country => country.currencies)
        .map(country => ({
          name: country.name.common,
          currencies: Object.keys(country.currencies),
          currencyDetails: country.currencies
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      return [];
    }
  };
  
  export const getExchangeRates = async (baseCurrency = 'USD') => {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
      const data = await response.json();
      return data.rates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      return {};
    }
  };
  
  export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) {
      return parseFloat(amount);
    }
    
    try {
      const rates = await getExchangeRates(fromCurrency);
      const convertedAmount = amount * (rates[toCurrency] || 1);
      return parseFloat(convertedAmount.toFixed(2));
    } catch (error) {
      console.error('Currency conversion failed:', error);
      return parseFloat(amount);
    }
  };
  
  export const formatCurrency = (amount, currencyCode) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2
      }).format(amount);
    } catch {
      return `${currencyCode} ${amount}`;
    }
  };
  