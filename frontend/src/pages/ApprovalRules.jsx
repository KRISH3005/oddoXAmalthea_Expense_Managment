import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Settings,
  Users,
  Percent,
  Target
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ApprovalRules = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    step_order: 1,
    rule_type: 'specific',
    special_role: '',
    threshold: 50,
    is_manager_approver: false,
    active: true
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRules();
    fetchAvailableRoles();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/approval-rules');
      setRules(response.data.rules || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      setError('Failed to fetch approval rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await axios.get('/approval-rules/roles');
      setAvailableRoles(response.data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      if (editingRule) {
        await axios.put(`/approval-rules/${editingRule.id}`, formData);
        setSuccess('Approval rule updated successfully');
      } else {
        await axios.post('/approval-rules', formData);
        setSuccess('Approval rule created successfully');
      }

      setShowModal(false);
      setEditingRule(null);
      setFormData({
        step_order: 1,
        rule_type: 'specific',
        special_role: '',
        threshold: 50,
        is_manager_approver: false,
        active: true
      });
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      setError(error.response?.data?.message || 'Failed to save approval rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      step_order: rule.step_order,
      rule_type: rule.rule_type,
      special_role: rule.special_role,
      threshold: rule.threshold,
      is_manager_approver: rule.is_manager_approver || false,
      active: rule.active
    });
    setShowModal(true);
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this approval rule?')) {
      return;
    }

    try {
      await axios.delete(`/approval-rules/${ruleId}`);
      setSuccess('Approval rule deleted successfully');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      setError('Failed to delete approval rule');
    }
  };

  const handleReorder = async (newRules) => {
    try {
      const reorderData = newRules.map((rule, index) => ({
        id: rule.id,
        step_order: index + 1
      }));

      await axios.put('/approval-rules/reorder', { rules: reorderData });
      setRules(newRules);
      setSuccess('Approval rules reordered successfully');
    } catch (error) {
      console.error('Error reordering rules:', error);
      setError('Failed to reorder approval rules');
    }
  };

  const getRuleTypeIcon = (ruleType) => {
    switch (ruleType) {
      case 'specific':
        return <Target className="w-4 h-4" />;
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'hybrid':
        return <Settings className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getRuleTypeLabel = (ruleType) => {
    switch (ruleType) {
      case 'specific':
        return 'Specific Approver';
      case 'percentage':
        return 'Percentage Based';
      case 'hybrid':
        return 'Hybrid (Percentage + Specific)';
      default:
        return ruleType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Approval Rules</h1>
          <p className="text-gray-400 mt-1">
            Configure approval workflows and thresholds for your company
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Rules List */}
      <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium mb-2">No approval rules configured</p>
            <p className="text-sm">Create your first approval rule to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {rules.map((rule, index) => (
              <div
                key={rule.id}
                className="p-6 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <GripVertical className="w-4 h-4" />
                      <span className="text-sm font-medium">Step {rule.step_order}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getRuleTypeIcon(rule.rule_type)}
                      <span className="font-medium text-white">
                        {getRuleTypeLabel(rule.rule_type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{rule.special_role}</span>
                    </div>
                    
                    {rule.rule_type === 'percentage' || rule.rule_type === 'hybrid' ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Percent className="w-4 h-4" />
                        <span>{rule.threshold}%</span>
                      </div>
                    ) : null}
                    
                    {rule.is_manager_approver && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Users className="w-3 h-3" />
                        Manager First
                      </div>
                    )}
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rule.active 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  {editingRule ? 'Edit Approval Rule' : 'Add Approval Rule'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingRule(null);
                    setFormData({
                      step_order: 1,
                      rule_type: 'specific',
                      special_role: '',
                      threshold: 50,
                      active: true
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Step Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.step_order}
                    onChange={(e) => setFormData({ ...formData, step_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rule Type
                  </label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="specific">Specific Approver</option>
                    <option value="percentage">Percentage Based</option>
                    <option value="hybrid">Hybrid (Percentage + Specific)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.special_role}
                    onChange={(e) => setFormData({ ...formData, special_role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select a role</option>
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {(formData.rule_type === 'percentage' || formData.rule_type === 'hybrid') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_manager_approver"
                    checked={formData.is_manager_approver}
                    onChange={(e) => setFormData({ ...formData, is_manager_approver: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 bg-gray-800 border-gray-700 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="is_manager_approver" className="text-sm font-medium text-gray-300">
                    Manager Approver (Expense must be approved by manager first)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 bg-gray-800 border-gray-700 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-300">
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRule(null);
                      setFormData({
                        step_order: 1,
                        rule_type: 'specific',
                        special_role: '',
                        threshold: 50,
                        active: true
                      });
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalRules;
