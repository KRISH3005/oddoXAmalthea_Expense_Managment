import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Mail, Shield, Calendar } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    managerId: ''
  });

  const roles = ['Employee', 'Manager', 'Admin'];

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await axios.put(`/users/${editUser.id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          managerId: formData.managerId || null
        });
      } else {
        await axios.post('/users', formData);
      }
      
      setShowForm(false);
      setEditUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Employee',
        managerId: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please check the details and try again.');
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role,
      managerId: user.manager_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user.');
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'Manager': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Employee': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return '👑';
      case 'Manager': return '👨‍💼';
      case 'Employee': return '👤';
      default: return '❓';
    }
  };

  const managers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');

  if (user?.role !== 'Admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-400 mb-2">Access Denied</h3>
        <p className="text-gray-500">Only administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Team Management</h1>
          <p className="text-gray-400">Manage users, roles, and permissions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Users Grid */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <p className="text-gray-400 mt-2">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">Add your first team member to get started</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Manager</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Joined</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {userItem.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{userItem.name}</p>
                          <p className="text-gray-400 text-sm">{userItem.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getRoleIcon(userItem.role)}</span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRoleColor(userItem.role)}`}>
                          {userItem.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {userItem.manager_name || 'No Manager'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(userItem)}
                          className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {userItem.id !== user.id && (
                          <button
                            onClick={() => handleDelete(userItem.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-emerald-500/20 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditUser(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                  placeholder="Enter email address"
                  required
                />
              </div>

              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field"
                    placeholder="Enter password"
                    required={!editUser}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="input-field"
                  required
                >
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {getRoleIcon(role)} {role}
                    </option>
                  ))}
                </select>
              </div>

              {formData.role === 'Employee' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Manager (Optional)
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, managerId: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">No Manager</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditUser(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editUser ? 'Update' : 'Create'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
