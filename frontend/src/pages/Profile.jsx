import React, { useState } from 'react';
import { User, Mail, Building, MapPin, DollarSign, Calendar, Shield, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, company, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const handleSave = async () => {
    // TODO: Implement profile update API call
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <p className="text-gray-400">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-white">Personal Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 py-1 text-green-400 hover:text-green-300 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              {!isEditing ? (
                <div>
                  <h3 className="text-2xl font-bold text-white">{user?.name}</h3>
                  <p className="text-gray-400">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg">{getRoleIcon(user?.role)}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRoleColor(user?.role)}`}>
                      {user?.role}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Role</p>
                  <p className="text-white font-medium">{user?.role}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Joined</p>
                  <p className="text-white font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Department</p>
                  <p className="text-white font-medium">General</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6">Company Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
              <Building className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-gray-400 text-sm">Company</p>
                <p className="text-white font-medium">{company?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-gray-400 text-sm">Country</p>
                <p className="text-white font-medium">{company?.country || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-gray-400 text-sm">Currency</p>
                <p className="text-white font-medium">{company?.baseCurrency || 'USD'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-gray-400 text-sm">Established</p>
                <p className="text-white font-medium">
                  {company?.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-6">Account Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn-secondary">Change Password</button>
          <button className="btn-secondary">Download Data</button>
          <button 
            onClick={logout}
            className="px-6 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
