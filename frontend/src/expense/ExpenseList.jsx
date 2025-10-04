import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authHooks';
import * as expenseService from '../../api/expenseService';
import * as currencyService from '../../api/currencyService';

const ExpenseList = ({ refreshTrigger }) => {
  const { company } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expenseService.getExpenses(filters);
      setExpenses(response.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'pending': return 'status-pending';
      default: return 'status-draft';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  return (
    <div className="expense-list">
      <div className="list-header">
        <h3>Your Expenses</h3>
        <div className="filters">
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="">All Categories</option>
            <option value="Meals">Meals</option>
            <option value="Travel">Travel</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Software">Software</option>
            <option value="Training">Training</option>
            <option value="Equipment">Equipment</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            placeholder="Start Date"
          />

          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            placeholder="End Date"
          />
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="no-expenses">
          <p>No expenses found. Create your first expense!</p>
        </div>
      ) : (
        <div className="expense-cards">
          {expenses.map((expense) => (
            <div key={expense.id} className="expense-card">
              <div className="expense-header">
                <h4>{expense.description}</h4>
                <span className={`status-badge ${getStatusBadgeClass(expense.status)}`}>
                  {expense.status || 'Draft'}
                </span>
              </div>

              <div className="expense-details">
                <div className="detail-item">
                  <span className="label">Amount:</span>
                  <span className="value">
                    {currencyService.formatCurrency(expense.amount, expense.currency)}
                    {expense.currency !== company?.baseCurrency && (
                      <small className="converted">
                        ({currencyService.formatCurrency(expense.convertedAmount, company?.baseCurrency)})
                      </small>
                    )}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="label">Category:</span>
                  <span className="value">{expense.category}</span>
                </div>

                <div className="detail-item">
                  <span className="label">Date:</span>
                  <span className="value">{formatDate(expense.date)}</span>
                </div>

                {expense.receiptUrl && (
                  <div className="detail-item">
                    <span className="label">Receipt:</span>
                    <a 
                      href={expense.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="receipt-link"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
              </div>

              {expense.approvals && expense.approvals.length > 0 && (
                <div className="approval-history">
                  <h5>Approval History:</h5>
                  {expense.approvals.map((approval, index) => (
                    <div key={index} className="approval-item">
                      <span className="approver">{approval.approverName}</span>
                      <span className={`approval-status ${approval.status.toLowerCase()}`}>
                        {approval.status}
                      </span>
                      {approval.comments && (
                        <div className="approval-comments">{approval.comments}</div>
                      )}
                      <div className="approval-date">
                        {formatDate(approval.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
