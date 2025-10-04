import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>Profile</h1>
      <div>Name: {user.name}</div>
      <div>Email: {user.email}</div>
      <div>Company: {user.companyName}</div>
      <div>Role: {user.role}</div>
    </div>
  );
}
