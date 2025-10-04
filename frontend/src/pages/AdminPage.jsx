import React, { useState } from 'react';
import UserManagement from '../components/admin/UserManagement';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'User Management' },
    { id: 'rules', label: 'Approval Rules' },
    { id: 'settings', label: 'Company Settings' }
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Admin Panel</h2>
        <p>Manage users, approval rules, and company settings</p>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'rules' && (
          <div className="coming-soon">
            <h3>Approval Rules Configuration</h3>
            <p>Feature coming soon - Configure approval workflows and thresholds</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="coming-soon">
            <h3>Company Settings</h3>
            <p>Feature coming soon - Manage company-wide settings</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
