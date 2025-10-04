import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as approvalService from '../../api/approvalService';
import * as currencyService from '../../api/currencyService';

const ApprovalQueue = () => {
  const { user, company } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkComments, setBulkComments] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await approvalService.getPendingApprovals();
      setPendingApprovals(response.approvals || []);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleAction = async (expenseId, action, comments = '') => {
    try {
      if (action === 'approve') {
        await approvalService.approveExpense(expenseId, comments);
      } else {
        await approvalService.rejectExpense(expenseId, comments);
      }
      
      // Refresh the list
      fetchPendingApprovals();
      alert(`Expense ${action}d successfully!`);
    } catch (error) {
      alert(`Failed to ${action} expense: ` + (error.response?.data?.message || error.message));
    }
  };

  const handleBulkAction = async () => {
    if (selectedExpenses.length === 0) {
      alert('Please select at least one expense');
      return;
    }

    if (!bulkAction) {
      alert('Please select an action');
      return;
    }

    try {
      if (bulkAction === 'approve') {
        await approvalService.bulkApprove(selectedExpenses, bulkComments);
      } else {
        await approvalService.bulkReject(selectedExpenses, bulkComments);
      }

      setSelectedExpenses([]);
      setBulkComments('');
      fetchPendingApprovals();
      alert(`${selectedExpenses.length} expenses ${bulkAction}d successfully!`);
    } catch (error) {
      alert(`Bulk ${bulkAction} failed: ` + (error.response?.data?.message || error.message));
    }
  };

  const toggleExpenseSelection = (expenseId) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const selectAllExpenses = () => {
    if (selectedExpenses.length === pendingApprovals.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(pendingApprovals.map(approval => approval.expense.id));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading approvals...</div>;
  }

  return (
    <div className="approval-queue">
      <div className="queue-header">
        <h3>Pending Approvals ({pendingApprovals.length})</h3>
        
        {pendingApprovals.length > 0 && (
          <div className="bulk-actions">
            <input
              type="checkbox"
              checked={selectedExpenses.length === pendingApprovals.length && pendingApprovals.length > 0}
              onChange={selectAllExpenses}
            />
            <label>Select All</label>

            <select 
              value={bulkAction} 
              onChange={(e) => setBulkAction(e.target.value)}
            >
              <option value="">Bulk Action</option>
              <option value="approve">Approve Selected</option>
              <option value="reject">Reject Selected</option>
            </select>

            <input
              type="text"
              placeholder="Comments (optional)"
              value={bulkComments}
              onChange={(e) => setBulkComments(e.target.value)}
            />

            <button 
              onClick={handleBulkAction}
              disabled={selectedExpenses.length === 0 || !bulkAction}
              className="bulk-action-btn"
            >
              Apply ({selectedExpenses.length})
            </button>
          </div>
        )}
      </div>

      {pendingApprovals.length === 0 ? (
        <div className="no-approvals">
          <p>No pending approvals at this time.</p>
        </div>
      ) : (
        <div className="approval-cards">
          {pendingApprovals.map((approval) => (
            <div key={approval.id} className="approval-card">
              <div className="card-header">
                <input
                  type="checkbox"
                  checked={selectedExpenses.includes(approval.expense.id)}
                  onChange={() => toggleExpenseSelection(approval.expense.id)}
                />
                <h4>{approval.expense.description}</h4>
                <div className="submitter-info">
                  by {approval.expense.submitterName}
                </div>
              </div>

              <div className="expense-info">
                <div className="info-row">
                  <span className="label">Amount:</span>
                  <span className="value">
                    {currencyService.formatCurrency(approval.expense.amount, approval.expense.currency)}
                    {approval.expense.currency !== company?.baseCurrency && (
                      <small className="converted">
                        ({currencyService.formatCurrency(approval.expense.convertedAmount, company?.baseCurrency)})
                      </small>
                    )}
                  </span>
                </div>

                <div className="info-row">
                  <span className="label">Category:</span>
                  <span className="value">{approval.expense.category}</span>
                </div>

                <div className="info-row">
                  <span className="label">Date:</span>
                  <span className="value">{formatDate(approval.expense.date)}</span>
                </div>

                <div className="info-row">
                  <span className="label">Submitted:</span>
                  <span className="value">{formatDate(approval.expense.createdAt)}</span>
                </div>

                {approval.expense.receiptUrl && (
                  <div className="info-row">
                    <span className="label">Receipt:</span>
                    <a 
                      href={approval.expense.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="receipt-link"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
              </div>

              <div className="approval-actions">
                <button
                  onClick={() => {
                    const comments = prompt('Enter approval comments (optional):');
                    if (comments !== null) {
                      handleSingleAction(approval.expense.id, 'approve', comments);
                    }
                  }}
                  className="approve-btn"
                >
                  Approve
                </button>

                <button
                  onClick={() => {
                    const comments = prompt('Enter rejection reason:');
                    if (comments) {
                      handleSingleAction(approval.expense.id, 'reject', comments);
                    }
                  }}
                  className="reject-btn"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;
