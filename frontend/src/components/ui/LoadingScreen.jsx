import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-l-emerald-400 rounded-full animate-spin animation-delay-150 mx-auto"></div>
        </div>
        <h2 className="text-2xl font-bold text-emerald-500 mb-2">ExpenseTracker</h2>
        <p className="text-gray-400">Loading your workspace...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
