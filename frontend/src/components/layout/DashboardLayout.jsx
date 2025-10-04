import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Home, 
  Receipt, 
  CheckSquare, 
  Settings,
  Users, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggler from '../ui/ThemeToggler';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, company, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: location.pathname === '/' },
    { name: 'Expenses', href: '/expenses', icon: Receipt, current: location.pathname === '/expenses' },
    ...(user.role === 'Manager' || user.role === 'Admin' || user.role === 'CFO' 
      ? [{ name: 'Approvals', href: '/approvals', icon: CheckSquare, current: location.pathname === '/approvals' }] 
      : []),
    ...(user.role === 'Admin' || user.role === 'CFO' 
      ? [{ name: 'Approval Rules', href: '/approval-rules', icon: Settings, current: location.pathname === '/approval-rules' }] 
      : []),
    ...(user.role === 'Admin' 
      ? [{ name: 'Manager Relationships', href: '/managers', icon: Building, current: location.pathname === '/managers' }] 
      : []),
    ...(user.role === 'Admin' 
      ? [{ name: 'Users', href: '/users', icon: Users, current: location.pathname === '/users' }] 
      : []),
    { name: 'Profile', href: '/profile', icon: User, current: location.pathname === '/profile' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-gray-900/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/50 backdrop-blur-lg border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-gray-800">
            <h1 className="text-xl font-bold">
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-transparent bg-clip-text">
                ExpenseTracker
              </span>
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Company info */}
          <div className="px-6 py-4 border-b border-gray-800">
            <p className="text-sm text-gray-400">Company</p>
            <p className="font-medium text-emerald-400">{company?.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {user.name} • {user.role}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      item.current
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-emerald-400'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 transition-colors ${
                        item.current ? 'text-emerald-400' : 'text-gray-400 group-hover:text-emerald-400'
                      }`}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-400" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-2xl font-bold text-white lg:block hidden">
              {navigation.find(item => item.current)?.name || 'Dashboard'}
            </h1>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
              </button>
              <ThemeToggler />
              <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-gray-700">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.role}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
