import React, { useState, useEffect } from 'react';
import * as userService from '../../api/userService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Employee',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.createUser(formData);
      setFormData({ name: '', email: '', role: 'Employee', password: '' });
      setShowCreateForm(false);
      fetchUsers();
      alert('User created successfully!');
    } catch (error) {
      alert('Failed to create user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.updateUser(editingUser.id, formData);
      setFormData({ name: '', email: '', role: 'Employee', password: '' });
      setEditingUser(null);
      fetchUsers();
      alert('User updated successfully!');
    } catch (error) {
      alert('Failed to update user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await userService.deleteUser(userId);
        fetchUsers();
        alert('User deleted successfully!');
      } catch (error) {
        alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      fetchUsers();
      alert('User role updated successfully!');
    } catch (error) {
      alert('Failed to update user role: ' + (error.response?.data?.message || error.message));
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'Employee', password: '' });
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h3>User Management</h3>
        <button 
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingUser(null);
            setFormData({ name: '', email: '', role: 'Employee', password: '' });
          }}
          className="create-user-btn"
        >
          {showCreateForm ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {(showCreateForm || editingUser) && (
        <div className="user-form">
          <h4>{editingUser ? 'Edit User' : 'Create New User'}</h4>
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  minLength={6}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button type="button" onClick={editingUser ? cancelEdit : () => setShowCreateForm(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="role-select"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td>
                  <span className={`status-badge ${user.status?.toLowerCase()}`}>
                    {user.status || 'Active'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => startEdit(user)} className="edit-btn">
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id, user.name)} 
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
