import React, { useState } from 'react';
import ExpenseForm from '../components/expense/ExpenseForm';
import ExpenseList from '../components/expense/ExpenseList';

const ExpensePage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExpenseCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="expense-page">
      <div className="page-header">
        <h2>Expense Management</h2>
        <p>Submit and track your business expenses</p>
      </div>

      <div className="expense-content">
        <ExpenseForm onExpenseCreated={handleExpenseCreated} />
        <ExpenseList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default ExpensePage;
