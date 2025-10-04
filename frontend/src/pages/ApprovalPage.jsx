import React from 'react';
import ApprovalQueue from '../components/approval/ApprovalQueue';

const ApprovalPage = () => {
  return (
    <div className="approval-page">
      <div className="page-header">
        <h2>Expense Approvals</h2>
        <p>Review and approve expense requests from your team</p>
      </div>

      <div className="approval-content">
        <ApprovalQueue />
      </div>
    </div>
  );
};

export default ApprovalPage;
