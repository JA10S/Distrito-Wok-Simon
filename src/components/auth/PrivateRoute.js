import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser, userRoles, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-negro">
        <div className="text-dorado text-xl">Cargando...</div>
      </div>
    );
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
