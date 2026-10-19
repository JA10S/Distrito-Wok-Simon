import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../common/LoadingScreen';

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser, userRoles, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  const hasAllowedRole = userRoles.some(role => allowedRoles.includes(role));
  
  if (!hasAllowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;
