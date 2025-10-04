import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCountriesWithCurrencies } from '../../api/currencyService';

const SignupForm = ({ onSwitchToLogin }) => {
  const { signup, error, loading } = useAuth();
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    country: '',
    baseCurrency: ''
  });

  useEffect(() => {
    const fetchCountries = async () => {
      const countriesData = await getCountriesWithCurrencies();
      setCountries(countriesData);
    };
    fetchCountries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'country') {
      const country = countries.find(c => c.name === value);
      setSelectedCountry(value);
      setAvailableCurrencies(country ? country.currencies : []);
      setFormData(prev => ({ ...prev, baseCurrency: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        country: formData.country,
        baseCurrency: formData.baseCurrency
      });
    } catch (error) {
      // Error handled by context
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Create Account</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="companyName">Company Name</label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          required
          placeholder="Enter your company name"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
          >
            <option value="">Select your country</option>
            {countries.map(country => (
              <option key={country.name} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="baseCurrency">Base Currency</label>
          <select
            id="baseCurrency"
            name="baseCurrency"
            value={formData.baseCurrency}
            onChange={handleChange}
            required
            disabled={!selectedCountry}
          >
            <option value="">Select currency</option>
            {availableCurrencies.map(currency => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Create a password"
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
          />
        </div>
      </div>

      <button type="submit" className="auth-button" disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="link-button">
          Sign in here
        </button>
      </p>
    </form>
  );
};

export default SignupForm;
