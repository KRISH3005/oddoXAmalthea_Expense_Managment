import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Upload, Eye, Edit2, Trash2, Calendar, DollarSign } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getSupportedCurrencies, convertCurrency, formatCurrency as formatCurrencyUtil } from '../utils/currencyUtils';

const Expenses = () => {
  const { user, company } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [converting, setConverting] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: company?.baseCurrency || 'USD',
    category: '',
    expenseDate: new Date().toISOString().split('T')[0],
    receiptUrl: ''
  });

  const categories = [
    'Meals', 'Travel', 'Accommodation', 'Transportation', 
    'Office Supplies', 'Equipment', 'Marketing', 'Training', 'Other'
  ];

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  // Auto-convert to company currency when amount/currency changes
  useEffect(() => {
    const performConversion = async () => {
      if (formData.amount && formData.currency && company?.baseCurrency && 
          formData.currency !== company.baseCurrency && parseFloat(formData.amount) > 0) {
        setConverting(true);
        try {
          const converted = await convertCurrency(
            parseFloat(formData.amount), 
            formData.currency, 
            company.baseCurrency
          );
          setConvertedAmount(converted);
        } catch (error) {
          console.error('Conversion error:', error);
          setConvertedAmount(null);
        } finally {
          setConverting(false);
        }
      } else {
        setConvertedAmount(null);
      }
    };

    const debounceTimer = setTimeout(performConversion, 800);
    return () => clearTimeout(debounceTimer);
  }, [formData.amount, formData.currency, company?.baseCurrency]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const response = await axios.get('/expenses', { params });
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        convertedAmount: convertedAmount || parseFloat(formData.amount)
      };

      if (editExpense) {
        await axios.put(`/expenses/${editExpense.id}`, submitData);
      } else {
        await axios.post('/expenses', submitData);
      }
      
      // Reset form
      setShowForm(false);
      setEditExpense(null);
      setConvertedAmount(null);
      setFormData({
        description: '',
        amount: '',
        currency: company?.baseCurrency || 'USD',
        category: '',
        expenseDate: new Date().toISOString().split('T')[0],
        receiptUrl: ''
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error submitting expense:', error);
      alert('Error submitting expense. Please try again.');
    }
  };

  const handleEdit = (expense) => {
    setEditExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      expenseDate: expense.expense_date?.split('T')[0] || '',
      receiptUrl: expense.receipt_url || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await axios.delete(`/expenses/${id}`);
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatCurrency = (amount, currency) => {
    return formatCurrencyUtil(amount, currency || 'USD');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {user.role === 'Admin' || user.role === 'CFO' ? 'Company Expenses' : 'My Expenses'}
          </h1>
          <p className="text-gray-400">
            {user.role === 'Admin' || user.role === 'CFO' 
              ? 'View and manage all company expense claims' 
              : 'Track and manage your expense claims'
            }
          </p>
        </div>
        {(user.role === 'Employee' || user.role === 'Manager') && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Expense
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <p className="text-gray-400 mt-2">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No expenses found</h3>
            <p className="text-gray-500 mb-6">
              {Object.values(filters).some(v => v !== '') 
                ? 'Try adjusting your filters' 
                : (user.role === 'Admin' || user.role === 'CFO')
                  ? 'No company expenses found'
                  : 'Create your first expense to get started'
              }
            </p>
            {(user.role === 'Employee' || user.role === 'Manager') && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Expense
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
                  {(user.role === 'Admin' || user.role === 'CFO') && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Submitted By</th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{expense.description}</p>
                        {expense.receipt_url && (
                          <p className="text-xs text-gray-400">📎 Receipt attached</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{expense.category}</td>
                    {(user.role === 'Admin' || user.role === 'CFO') && (
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {expense.submitter_name || 'Unknown'}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-emerald-400 font-bold">
                          {formatCurrency(expense.amount, expense.currency)}
                        </span>
                        {expense.currency !== company?.baseCurrency && expense.converted_amount && (
                          <p className="text-xs text-gray-400">
                            ≈ {formatCurrency(expense.converted_amount, company?.baseCurrency)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(expense.approval_status)}`}>
                        {expense.approval_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(expense.approval_status === 'pending' || expense.approval_status === 'rejected') && (
                          <>
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-emerald-500/20 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editExpense ? 'Edit Expense' : 'New Expense'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditExpense(null);
                  setConvertedAmount(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Client lunch meeting"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="input-field"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Currency *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="input-field"
                    required
                  >
                    {getSupportedCurrencies().map(currency => (
                      <option key={currency.code} value={currency.code} className="bg-gray-800">
                        {currency.symbol} {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Currency Conversion Display */}
              {convertedAmount && formData.currency !== company?.baseCurrency && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-400 text-sm font-medium">
                        🔄 Converted to Company Currency ({company?.baseCurrency})
                      </p>
                      <p className="text-white text-xl font-bold">
                        {formatCurrency(convertedAmount, company?.baseCurrency)}
                      </p>
                    </div>
                    {converting && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    💡 Managers will see this amount for approval
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expense Date *
                </label>
                <input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditExpense(null);
                    setConvertedAmount(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editExpense ? 'Update' : 'Create'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
