// Country to Currency mapping using the provided API
let countriesCache = null;

export const fetchCountriesWithCurrencies = async () => {
  if (countriesCache) return countriesCache;
  
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
    const data = await response.json();
    
    countriesCache = data.map(country => ({
      name: country.name.common,
      currencies: Object.keys(country.currencies || {}),
      primaryCurrency: Object.keys(country.currencies || {})[0] || 'USD'
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    return countriesCache;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return getDefaultCountries();
  }
};

export const getCurrencyByCountry = async (countryName) => {
  const countries = await fetchCountriesWithCurrencies();
  const country = countries.find(c => 
    c.name.toLowerCase() === countryName.toLowerCase()
  );
  return country?.primaryCurrency || 'USD';
};

const getDefaultCountries = () => [
  { name: 'India', currencies: ['INR'], primaryCurrency: 'INR' },
  { name: 'United States', currencies: ['USD'], primaryCurrency: 'USD' },
  { name: 'United Kingdom', currencies: ['GBP'], primaryCurrency: 'GBP' },
  { name: 'Germany', currencies: ['EUR'], primaryCurrency: 'EUR' },
  { name: 'Canada', currencies: ['CAD'], primaryCurrency: 'CAD' },
  { name: 'Australia', currencies: ['AUD'], primaryCurrency: 'AUD' },
  { name: 'Japan', currencies: ['JPY'], primaryCurrency: 'JPY' },
  { name: 'Singapore', currencies: ['SGD'], primaryCurrency: 'SGD' },
  { name: 'France', currencies: ['EUR'], primaryCurrency: 'EUR' },
  { name: 'Brazil', currencies: ['BRL'], primaryCurrency: 'BRL' },
  { name: 'Mexico', currencies: ['MXN'], primaryCurrency: 'MXN' },
  { name: 'China', currencies: ['CNY'], primaryCurrency: 'CNY' },
  { name: 'South Korea', currencies: ['KRW'], primaryCurrency: 'KRW' },
  { name: 'Thailand', currencies: ['THB'], primaryCurrency: 'THB' },
  { name: 'Malaysia', currencies: ['MYR'], primaryCurrency: 'MYR' },
];
