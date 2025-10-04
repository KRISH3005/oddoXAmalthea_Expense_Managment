

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../context/authHooks';
import * as expenseService from '../../api/expenseService';
import * as currencyService from '../../api/currencyService';

const ExpenseForm = ({ onExpenseCreated }) => {
  const { company } = useAuth();
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: company?.baseCurrency || 'USD',
    category: 'Meals',
    date: new Date().toISOString().split('T')[0]
  });
  const [convertedAmount, setConvertedAmount] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    'Meals', 'Travel', 'Office Supplies', 'Software', 
    'Training', 'Equipment', 'Entertainment', 'Other'
  ];

  useEffect(() => {
    const fetchCountries = async () => {
      const countriesData = await currencyService.getCountriesWithCurrencies();
      setCountries(countriesData);
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const convertCurrency = async () => {
      if (formData.amount && formData.currency !== company?.baseCurrency) {
        try {
          const converted = await currencyService.convertCurrency(
            parseFloat(formData.amount),
            formData.currency,
            company.baseCurrency
          );
          setConvertedAmount(converted);
        } catch {
          setConvertedAmount('');
        }
      } else {
        setConvertedAmount(formData.amount);
      }
    };

    convertCurrency();
  }, [formData.amount, formData.currency, company?.baseCurrency]);

  const onDrop = useCallback((acceptedFiles) => {
    setReceipt(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 5242880 // 5MB
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        convertedAmount: parseFloat(convertedAmount) || parseFloat(formData.amount)
      };

      const response = await expenseService.createExpense(expenseData);
      
      // Upload receipt if provided
      if (receipt && response.expense) {
        try {
          await expenseService.uploadReceipt(response.expense.id, receipt);
        } catch (error) {
          console.error('Receipt upload failed:', error);
        }
      }

      // Reset form
      setFormData({
        description: '',
        amount: '',
        currency: company?.baseCurrency || 'USD',
        category: 'Meals',
        date: new Date().toISOString().split('T')[0]
      });
      setReceipt(null);

      if (onExpenseCreated) {
        onExpenseCreated(response.expense);
      }

      alert('Expense created successfully!');
    } catch (error) {
      alert('Failed to create expense: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getAllCurrencies = () => {
    const currencySet = new Set();
    countries.forEach(country => {
      country.currencies.forEach(currency => currencySet.add(currency));
    });
    return Array.from(currencySet).sort();
  };

  return (
    <div className="expense-form">
      <h3>Submit New Expense</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Enter expense description"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              required
            >
              {getAllCurrencies().map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {formData.amount && formData.currency !== company?.baseCurrency && (
          <div className="currency-conversion">
            <small>
              Converted to {company?.baseCurrency}: {currencyService.formatCurrency(convertedAmount, company?.baseCurrency)}
            </small>
          </div>
        )}

        <div className="form-group">
          <label>Receipt</label>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {receipt ? (
              <div className="file-info">
                <p>Selected: {receipt.name}</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); setReceipt(null); }}>
                  Remove
                </button>
              </div>
            ) : (
              <div className="dropzone-content">
                <p>Drag & drop a receipt here, or click to select</p>
                <small>Supports: Images (JPEG, PNG, GIF) and PDF files up to 5MB</small>
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Creating Expense...' : 'Submit Expense'}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;
