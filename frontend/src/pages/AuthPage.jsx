import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Building, Mail, Lock, User, MapPin, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchCountriesWithCurrencies, getCurrencyByCountry } from '../utils/countryUtils';
import ThemeToggler from '../components/ui/ThemeToggler';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    country: '',
    baseCurrency: 'USD'
  });

  const { login, signup, loading, error } = useAuth();

  // Load countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesData = await fetchCountriesWithCurrencies();
        setCountries(countriesData);
      } catch (error) {
        console.error('Error loading countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Auto-set currency when country changes
  const handleCountryChange = async (countryName) => {
    setFormData(prev => ({ ...prev, country: countryName }));
    
    if (countryName) {
      const currency = await getCurrencyByCountry(countryName);
      setFormData(prev => ({ ...prev, baseCurrency: currency }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      await login(formData.email, formData.password);
    } else {
      await signup(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950/20 flex items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <ThemeToggler />
      </div>
      
      <div className="absolute top-6 left-6">
        <Link to="/" className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-transparent bg-clip-text">
            ExpenseTracker
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-emerald-500/20 p-8 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-transparent bg-clip-text">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </span>
            </h2>
            <p className="text-gray-400">
              {isLogin ? 'Sign in to your account' : 'Create your company account'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field pl-12"
                      placeholder="Enter your full name"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="input-field pl-12"
                      placeholder="Enter company name"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      {loadingCountries ? (
                        <div className="input-field pl-12 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500 mr-2"></div>
                          Loading countries...
                        </div>
                      ) : (
                        <select
                          value={formData.country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="input-field pl-12 appearance-none"
                          required={!isLogin}
                        >
                          <option value="">Select Country</option>
                          {countries.map(country => (
                            <option key={country.name} value={country.name} className="bg-gray-800">
                              {country.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Currency (Auto-selected)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.baseCurrency}
                        readOnly
                        className="input-field pl-12 bg-gray-700/50 cursor-not-allowed"
                        placeholder="Select country first"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Currency is automatically set based on selected country
                    </p>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-12"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-12 pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-emerald-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
