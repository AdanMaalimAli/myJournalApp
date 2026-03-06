import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading...</div>;
  }

  // If there is no token or user (and not loading), redirect to home
  // You might want to trigger the login modal here, but for now redirecting to home is safe
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
