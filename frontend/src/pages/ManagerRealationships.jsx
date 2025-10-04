import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Building,
  ChevronDown,
  ChevronRight,
  Crown,
  Shield,
  Target
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ManagerRelationships = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [relationshipsRes, chartRes] = await Promise.all([
        axios.get('/managers'),
        axios.get('/managers/chart')
      ]);
      
      setUsers(relationshipsRes.data.users || []);
      setHierarchy(chartRes.data.hierarchy || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch manager relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleEditManager = async (userId) => {
    try {
      setError(null);
      const response = await axios.get(`/managers/available/${userId}`);
      setAvailableManagers(response.data.managers || []);
      setEditingUser(users.find(u => u.id === userId));
      setSelectedManagerId(users.find(u => u.id === userId)?.manager_id || '');
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching available managers:', error);
      setError('Failed to load available managers');
    }
  };

  const handleSaveManager = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (selectedManagerId === editingUser.manager_id) {
        setShowModal(false);
        return;
      }

      await axios.put('/managers', {
        userId: editingUser.id,
        managerId: selectedManagerId || null
      });

      setSuccess('Manager relationship updated successfully');
      setShowModal(false);
      setEditingUser(null);
      setSelectedManagerId('');
      fetchData();
    } catch (error) {
      console.error('Error updating manager:', error);
      setError(error.response?.data?.message || 'Failed to update manager relationship');
    }
  };

  const handleRemoveManager = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this manager relationship?')) {
      return;
    }

    try {
      setError(null);
      await axios.delete(`/managers/${userId}`);
      setSuccess('Manager relationship removed successfully');
      fetchData();
    } catch (error) {
      console.error('Error removing manager:', error);
      setError('Failed to remove manager relationship');
    }
  };

  const toggleNode = (userId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedNodes(newExpanded);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'Manager':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'CFO':
        return <Target className="w-4 h-4 text-green-400" />;
      default:
        return <Users className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderHierarchyNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasSubordinates = node.subordinates && node.subordinates.length > 0;

    return (
      <div key={node.id} className="ml-4">
        <div className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors ${
          level === 0 ? 'bg-gray-800/30' : ''
        }`}>
          <div className="flex items-center gap-2">
            {hasSubordinates ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6" />
            )}
            
            {getRoleIcon(node.role)}
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{node.name}</span>
                <span className="text-xs text-gray-400">({node.role})</span>
              </div>
              <div className="text-sm text-gray-400">{node.email}</div>
              {node.manager_name && (
                <div className="text-xs text-gray-500">
                  Reports to: {node.manager_name}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditManager(node.id)}
              className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            {node.manager_id && (
              <button
                onClick={() => handleRemoveManager(node.id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <UserMinus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {isExpanded && hasSubordinates && (
          <div className="ml-4">
            {node.subordinates.map(subordinate => renderHierarchyNode(subordinate, level + 1))}
          </div>
        )}
      </div>
    );
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
          <h1 className="text-2xl font-bold text-white">Manager Relationships</h1>
          <p className="text-gray-400 mt-1">
            Manage organizational hierarchy and reporting relationships
          </p>
        </div>
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

      {/* Organizational Chart */}
      <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Organizational Chart</h2>
          </div>
        </div>
        
        <div className="p-6">
          {hierarchy.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-medium mb-2">No organizational structure</p>
              <p className="text-sm">Start by assigning manager relationships</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hierarchy.map(node => renderHierarchyNode(node))}
            </div>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">All Users</h2>
        </div>
        
        <div className="divide-y divide-gray-800">
          {users.map((user) => (
            <div key={user.id} className="p-6 hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getRoleIcon(user.role)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{user.name}</span>
                      <span className="text-sm text-gray-400">({user.role})</span>
                    </div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                    {user.manager_name ? (
                      <div className="text-sm text-gray-500">
                        Reports to: {user.manager_name}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No manager assigned</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditManager(user.id)}
                    className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {user.manager_id && (
                    <button
                      onClick={() => handleRemoveManager(user.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Edit Manager for {editingUser.name}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setSelectedManagerId('');
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Manager
                  </label>
                  <select
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">No Manager</option>
                    {availableManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={handleSaveManager}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                      setSelectedManagerId('');
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerRelationships;
