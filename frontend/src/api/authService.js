import api from './api';

export const getPendingApprovals = async () => {
  const response = await api.get('/approvals/pending');
  return response.data;
};

export const approveExpense = async (expenseId, comments = '') => {
  const response = await api.post(`/approvals/${expenseId}/approve`, { comments });
  return response.data;
};

export const rejectExpense = async (expenseId, comments = '') => {
  const response = await api.post(`/approvals/${expenseId}/reject`, { comments });
  return response.data;
};

export const getApprovalHistory = async () => {
  const response = await api.get('/approvals/history');
  return response.data;
};

export const bulkApprove = async (expenseIds, comments = '') => {
  const response = await api.post('/approvals/bulk-approve', { expenseIds, comments });
  return response.data;
};

export const bulkReject = async (expenseIds, comments = '') => {
  const response = await api.post('/approvals/bulk-reject', { expenseIds, comments });
  return response.data;
};
