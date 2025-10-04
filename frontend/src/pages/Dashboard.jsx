import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, DollarSign, Users, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, company } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    expenses: [],
    pendingApprovals: [],
    stats: {
      totalExpenses: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,
      thisMonthExpenses: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch expenses
      const expensesResponse = await axios.get('/expenses');
      const expenses = expensesResponse.data.expenses || [];
      
      // Fetch pending approvals if user is Manager/Admin
      let pendingApprovals = [];
      if (user.role === 'Manager' || user.role === 'Admin') {
        try {
          const approvalsResponse = await axios.get('/approvals/pending');
          pendingApprovals = approvalsResponse.data.approvals || [];
        } catch (error) {
          console.warn('Could not fetch pending approvals:', error);
        }
      }

      // Calculate statistics
      const stats = calculateStats(expenses);

      setDashboardData({
        expenses,
        pendingApprovals,
        stats
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (expenses) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const pendingAmount = expenses
      .filter(exp => exp.approval_status === 'pending')
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const approvedAmount = expenses
      .filter(exp => exp.approval_status === 'approved')
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const rejectedAmount = expenses
      .filter(exp => exp.approval_status === 'rejected')
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    
    const thisMonthExpenses = expenses
      .filter(exp => {
        const expenseDate = new Date(exp.expense_date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    return {
      totalExpenses,
      pendingAmount,
      approvedAmount,
      rejectedAmount,
      thisMonthExpenses
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: company?.baseCurrency || 'USD',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'emerald', trend = null, link = null }) => {
    const CardComponent = link ? Link : 'div';
    const cardProps = link ? { to: link } : {};
    
    return (
      <CardComponent {...cardProps} className={`card hover:scale-105 transition-all duration-300 ${link ? 'cursor-pointer hover:border-emerald-500/30' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold text-white mb-2">{value}</p>
            {trend && (
              <div className={`flex items-center text-sm ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
                {trend.positive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {trend.text}
              </div>
            )}
          </div>
          <div className={`w-12 h-12 bg-${color}-500/10 rounded-full flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
        </div>
      </CardComponent>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <p className="text-gray-400 ml-3">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, 
          <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-transparent bg-clip-text">
            {' ' + user.name}!
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Here's your expense overview for {company?.name}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/expenses" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Submit Expense
        </Link>
        {(user.role === 'Manager' || user.role === 'Admin') && dashboardData.pendingApprovals.length > 0 && (
          <Link to="/approvals" className="btn-secondary flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Review Approvals ({dashboardData.pendingApprovals.length})
          </Link>
        )}
        {user.role === 'Admin' && (
          <Link to="/users" className="btn-secondary flex items-center gap-2">
            <Users className="w-4 h-4" />
            Manage Users
          </Link>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Expenses"
          value={formatCurrency(dashboardData.stats.totalExpenses)}
          icon={DollarSign}
          color="emerald"
          link="/expenses"
        />
        
        <StatCard
          title="This Month"
          value={formatCurrency(dashboardData.stats.thisMonthExpenses)}
          icon={Receipt}
          color="blue"
          trend={{
            positive: dashboardData.stats.thisMonthExpenses > 0,
            text: `${dashboardData.expenses.filter(e => {
              const expenseDate = new Date(e.expense_date);
              const currentMonth = new Date().getMonth();
              const currentYear = new Date().getFullYear();
              return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
            }).length} expenses`
          }}
        />

        <StatCard
          title="Pending Approval"
          value={formatCurrency(dashboardData.stats.pendingAmount)}
          icon={Clock}
          color="yellow"
          link="/expenses"
        />

        <StatCard
          title="Approved"
          value={formatCurrency(dashboardData.stats.approvedAmount)}
          icon={CheckCircle}
          color="green"
          link="/expenses"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Recent Expenses</h2>
            <Link to="/expenses" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
              View All →
            </Link>
          </div>

          {dashboardData.expenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No expenses yet</p>
              <Link to="/expenses" className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create First Expense
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <div className="flex-1">
                    <p className="text-white font-medium">{expense.description}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-gray-400 text-sm">{expense.category}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </p>
                      <span className={`text-xs font-medium ${getStatusColor(expense.approval_status)}`}>
                        {expense.approval_status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-xs text-gray-400">{expense.currency}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manager/Admin: Pending Approvals */}
        {(user.role === 'Manager' || user.role === 'Admin') && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Pending Approvals</h2>
              <Link to="/approvals" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                View All →
              </Link>
            </div>

            {dashboardData.pendingApprovals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">All caught up!</p>
                <p className="text-gray-500 text-sm">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.pendingApprovals.slice(0, 5).map((approval) => {
                  const expense = approval.expense;
                  return (
                    <div key={approval.id} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex-1">
                        <p className="text-white font-medium">{expense.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-gray-400 text-sm">{approval.submitter_name}</p>
                          <p className="text-gray-400 text-sm">{expense.category}</p>
                          <span className="text-xs font-medium text-yellow-400">
                            Pending
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">
                          {formatCurrency(expense.amount)}
                        </p>
                        <Link 
                          to="/approvals" 
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          Review →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Employee: Expense Categories Breakdown */}
        {user.role === 'Employee' && dashboardData.expenses.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-6">Expense Categories</h2>
            
            {(() => {
              const categoryStats = dashboardData.expenses.reduce((acc, expense) => {
                const category = expense.category || 'Other';
                acc[category] = (acc[category] || 0) + parseFloat(expense.amount || 0);
                return acc;
              }, {});

              const sortedCategories = Object.entries(categoryStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

              const totalAmount = Object.values(categoryStats).reduce((sum, amount) => sum + amount, 0);

              return (
                <div className="space-y-3">
                  {sortedCategories.map(([category, amount]) => {
                    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">{category}</span>
                          <span className="text-emerald-400 font-bold">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">{percentage.toFixed(1)}% of total</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Recent Activity Feed */}
      {dashboardData.expenses.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {dashboardData.expenses
              .slice(0, 8)
              .map((expense) => (
                <div key={expense.id} className="flex items-center gap-4 p-3 hover:bg-gray-700/30 rounded-lg transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    expense.approval_status === 'approved' ? 'bg-green-400' :
                    expense.approval_status === 'rejected' ? 'bg-red-400' :
                    'bg-yellow-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-medium">{expense.description}</span>
                      {' '}was {expense.approval_status?.toLowerCase()}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(expense.updated_at || expense.created_at).toLocaleDateString()} • {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
