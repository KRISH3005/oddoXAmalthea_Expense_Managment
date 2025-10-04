import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authHooks';
import * as expenseService from '../api/expenseService';
import * as approvalService from '../api/approvalService';
import * as currencyService from '../api/currencyService';

const DashboardPage = () => {
  const { user, company } = useAuth();
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0,
    totalAmount: 0
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Skip API calls if no user (bypass mode)
      if (!user) {
        setStats({
          totalExpenses: 0,
          pendingExpenses: 0,
          approvedExpenses: 0,
          rejectedExpenses: 0,
          totalAmount: 0
        });
        setRecentExpenses([]);
        setPendingApprovals([]);
        setLoading(false);
        return;
      }

      // Fetch user's expenses
      const expenseResponse = await expenseService.getExpenses({ limit: 5 });
      const expenses = expenseResponse.expenses || [];
      setRecentExpenses(expenses);

      // Calculate stats
      const totalExpenses = expenses.length;
      const pendingExpenses = expenses.filter(e => e.status === 'Pending').length;
      const approvedExpenses = expenses.filter(e => e.status === 'Approved').length;
      const rejectedExpenses = expenses.filter(e => e.status === 'Rejected').length;
      const totalAmount = expenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);

      setStats({
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        totalAmount
      });

      // Fetch pending approvals if user is Manager or Admin
      if (user.role === 'Manager' || user.role === 'Admin') {
        const approvalResponse = await approvalService.getPendingApprovals();
        setPendingApprovals(approvalResponse.approvals || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome back{user ? `, ${user.name}` : ''}!</h2>
        <p className="user-role">
          {user ? `Role: ${user.role} at ${company?.name}` : 'Demo Mode - No Authentication Required'}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalExpenses}</h3>
            <p>Total Expenses</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingExpenses}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.approvedExpenses}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.rejectedExpenses}</h3>
            <p>Rejected</p>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{currencyService.formatCurrency(stats.totalAmount, company?.baseCurrency || 'USD')}</h3>
            <p>Total Amount</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h3>Recent Expenses</h3>
          {recentExpenses.length === 0 ? (
            <p>No expenses yet. <a href="/expenses">Create your first expense</a></p>
          ) : (
            <div className="expense-summary">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="expense-summary-item">
                  <div className="expense-info">
                    <span className="expense-description">{expense.description}</span>
                    <span className="expense-date">{formatDate(expense.date)}</span>
                  </div>
                  <div className="expense-amount">
                    {currencyService.formatCurrency(expense.amount, expense.currency)}
                  </div>
                  <div className={`expense-status ${expense.status?.toLowerCase() || 'draft'}`}>
                    {expense.status || 'Draft'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(user.role === 'Manager' || user.role === 'Admin') && (
          <div className="dashboard-section">
            <h3>Pending Approvals ({pendingApprovals.length})</h3>
            {pendingApprovals.length === 0 ? (
              <p>No pending approvals.</p>
            ) : (
              <div className="approval-summary">
                {pendingApprovals.slice(0, 5).map((approval) => (
                  <div key={approval.id} className="approval-summary-item">
                    <div className="approval-info">
                      <span className="approval-description">{approval.expense.description}</span>
                      <span className="approval-submitter">by {approval.expense.submitterName}</span>
                    </div>
                    <div className="approval-amount">
                      {currencyService.formatCurrency(approval.expense.convertedAmount, company?.baseCurrency)}
                    </div>
                  </div>
                ))}
                {pendingApprovals.length > 5 && (
                  <div className="view-all">
                    <a href="/approvals">View all {pendingApprovals.length} pending approvals</a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
