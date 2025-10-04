import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MessageSquare,
  Filter,
  Search,
  Eye,
  Clock,
  AlertCircle,
  Building,
  Users,
  DollarSign,
  FileText,
  RefreshCw
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Approvals = () => {
  const { user, company } = useAuth();

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [companyPendingApprovals, setCompanyPendingApprovals] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState("");
  const [comments, setComments] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchApprovals();
  }, [activeTab, statusFilter, typeFilter, fromDate, toDate]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        status: statusFilter,
        type: typeFilter,
        from: fromDate,
        to: toDate,
      };

      if (activeTab === "pending") {
        const res = await axios.get("/approvals/pending", { params });
        setPendingApprovals(res.data.approvals || []);
      } else if (activeTab === "history") {
        const res = await axios.get("/approvals/history", { params });
        setApprovalHistory(res.data.approvals || []);
      } else if (activeTab === "company" && (user.role === 'Admin' || user.role === 'Manager' || user.role === 'CFO')) {
        const res = await axios.get("/approvals/company/pending", { params });
        setCompanyPendingApprovals(res.data.approvals || []);
      }
      
      calculateStats();
    } catch (err) {
      console.error("Error fetching approvals:", err);
      setError("Failed to load approvals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const allApprovals = [...pendingApprovals, ...approvalHistory, ...companyPendingApprovals];
    const stats = {
      totalPending: pendingApprovals.length,
      totalApproved: approvalHistory.filter(a => a.action_taken === 'approved').length,
      totalRejected: approvalHistory.filter(a => a.action_taken === 'rejected').length,
      totalAmount: allApprovals.reduce((sum, approval) => {
        const expense = approval.expense || approval;
        return sum + (parseFloat(expense.amount) || 0);
      }, 0)
    };
    setStats(stats);
  };

  const handleAction = async (expenseId, action) => {
    try {
      setError(null);
      setSuccess(null);
      
      const endpoint = action === "approve" ? "approve" : "reject";
      const url = `/approvals/${expenseId}/${endpoint}`;
      
      console.log("=== DEBUGGING APPROVAL ACTION ===");
      console.log("Expense ID:", expenseId);
      console.log("Action:", action);
      console.log("Endpoint:", endpoint);
      console.log("Full URL:", url);
      console.log("Comments:", comments);
      console.log("================================");
      
      await axios.post(url, { comments });
      
      setSuccess(`Expense ${action}d successfully!`);
      setSelectedApproval(null);
      setActionType("");
      setComments("");
      
      // Refresh data
      await fetchApprovals();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error processing approval:", err);
      setError(err.response?.data?.message || 'Error processing approval. Please try again.');
    }
  };

  const handleRefresh = () => {
    fetchApprovals();
  };

  const clearFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setFromDate("");
    setToDate("");
    setSearchTerm("");
  };

  const getFilteredApprovals = () => {
    let approvals = [];
    
    if (activeTab === "pending") {
      approvals = pendingApprovals;
    } else if (activeTab === "history") {
      approvals = approvalHistory;
    } else if (activeTab === "company") {
      approvals = companyPendingApprovals;
    }

    // Apply search filter
    if (searchTerm) {
      approvals = approvals.filter(approval => {
        const expense = approval.expense || approval;
        return expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               approval.submitter_name?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return approvals;
  };

  const openActionModal = (approval, action) => {
    setSelectedApproval(approval);
    setActionType(action);
    setComments("");
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || company?.baseCurrency || "USD",
    }).format(amount);
  };

  const getApprovalTypeIcon = (approvalType) => {
    switch (approvalType) {
      case 'sequential': return <Clock className="w-4 h-4" />;
      case 'percentage': return <Users className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getApprovalTypeText = (approvalType) => {
    switch (approvalType) {
      case 'sequential': return 'Sequential';
      case 'percentage': return 'Percentage';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "rejected":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "pending":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const ApprovalCard = ({ approval, isPending = true }) => {
    const expense = approval.expense || approval;

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-4 shadow-lg hover:border-emerald-500/30 transition-all duration-200 hover:shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{expense.description}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
              <div className="flex items-center gap-1">
                <User size={14} />
                {approval.submitter_name || "Unknown Employee"}
              </div>
              {approval.approval_type && (
                <div className="flex items-center gap-1">
                  {getApprovalTypeIcon(approval.approval_type)}
                  {getApprovalTypeText(approval.approval_type)}
                </div>
              )}
              {approval.step_order && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  Step {approval.step_order}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
                expense.status || expense.approval_status
              )}`}
            >
              {expense.status || expense.approval_status || "pending"}
            </span>
            <div className="text-right">
              <div className="text-emerald-400 font-bold text-lg">
                {formatCurrency(expense.amount, expense.currency)}
              </div>
              <div className="text-xs text-gray-400">{expense.currency}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300 text-sm mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare size={16} />
            <span>{expense.category}</span>
          </div>
          {expense.receipt_url && (
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span className="text-emerald-400">Receipt attached</span>
            </div>
          )}
        </div>

        {approval.total_approvers && approval.approved_count !== undefined && (
          <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Approval Progress</span>
              <span className="text-sm text-emerald-400">
                {approval.approved_count}/{approval.total_approvers} approved
              </span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(approval.approved_count / approval.total_approvers) * 100}%` }}
              />
            </div>
          </div>
        )}

        {isPending && (
          <div className="flex gap-3">
            <button
              onClick={() => openActionModal(approval, "approve")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle size={16} /> Approve
            </button>
            <button
              onClick={() => openActionModal(approval, "reject")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle size={16} /> Reject
            </button>
            {expense.receipt_url && (
              <button
                onClick={() => window.open(expense.receipt_url, '_blank')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Eye size={16} /> View Receipt
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Expense Approvals</h1>
          <p className="text-gray-400">Review and manage expense approvals</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.totalPending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Approved</p>
              <p className="text-2xl font-bold text-green-400">{stats.totalApproved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Rejected</p>
              <p className="text-2xl font-bold text-red-400">{stats.totalRejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Amount</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "pending", label: "My Pending", icon: Clock },
          { key: "history", label: "My History", icon: CheckCircle },
          ...(user.role === 'Admin' || user.role === 'Manager' || user.role === 'CFO' 
            ? [{ key: "company", label: "Company Pending", icon: Building }] 
            : [])
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by description or submitter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {filtersOpen ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* Advanced Filters */}
        {filtersOpen && (
          <div className="border-t border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <input
                  type="text"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  placeholder="Expense Type"
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="card">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
            <p className="text-gray-400">Loading approvals...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            const filteredApprovals = getFilteredApprovals();
            
            if (filteredApprovals.length === 0) {
              return (
                <div className="card">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeTab === "pending" ? (
                        <Clock className="w-8 h-8 text-gray-500" />
                      ) : activeTab === "history" ? (
                        <CheckCircle className="w-8 h-8 text-gray-500" />
                      ) : (
                        <Building className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">
                      {activeTab === "pending" ? "No Pending Approvals" :
                       activeTab === "history" ? "No Approval History" :
                       "No Company Pending Approvals"}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {activeTab === "pending" ? "You have no pending approvals to review." :
                       activeTab === "history" ? "You haven't processed any approvals yet." :
                       "There are no pending approvals in your company."}
                    </p>
                    <button
                      onClick={handleRefresh}
                      className="btn-primary"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">
                    Showing {filteredApprovals.length} {activeTab === "pending" ? "pending" : 
                    activeTab === "history" ? "historical" : "company"} approval{filteredApprovals.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {filteredApprovals.map((approval) => (
                  <ApprovalCard 
                    key={approval.id} 
                    approval={approval} 
                    isPending={activeTab === "pending" || activeTab === "company"} 
                  />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Action Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {actionType === "approve" ? "Approve Expense" : "Reject Expense"}
                </h3>
                <button
                  onClick={() => {
                    setSelectedApproval(null);
                    setActionType("");
                    setComments("");
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Expense Details */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-white mb-2">{selectedApproval.expense?.description}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-emerald-400 font-bold ml-2">
                      {formatCurrency(selectedApproval.expense?.amount, selectedApproval.expense?.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white ml-2">{selectedApproval.expense?.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white ml-2">
                      {new Date(selectedApproval.expense?.expense_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Submitter:</span>
                    <span className="text-white ml-2">{selectedApproval.submitter_name}</span>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Comments {actionType === "reject" && <span className="text-red-400">*</span>}
                </label>
                <textarea
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  rows={4}
                  placeholder={actionType === "approve" ? "Add approval comments (optional)..." : "Please provide a reason for rejection..."}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  required={actionType === "reject"}
                />
                {actionType === "reject" && !comments && (
                  <p className="text-red-400 text-xs mt-1">Comments are required for rejection</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedApproval(null);
                    setActionType("");
                    setComments("");
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedApproval.expense?.id, actionType)}
                  disabled={actionType === "reject" && !comments}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                      : "bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  }`}
                >
                  {actionType === "approve" ? (
                    <>
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Approve
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 inline mr-2" />
                      Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
