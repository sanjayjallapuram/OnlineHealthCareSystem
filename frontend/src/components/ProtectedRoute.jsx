import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated, loading, checkAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Re-validate auth on protected route access
    if (!loading && !isAuthenticated) {
      checkAuth();
    }
  }, [loading, isAuthenticated, checkAuth]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <Box component="span" color="text.secondary">
          Verifying authentication...
        </Box>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return path
    const loginPath = user?.roles?.includes('ROLE_DOCTOR') ? '/doctor-login' : '/patient-login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (roles && !roles.some(role => user?.roles?.includes(role))) {
    // User's role is not authorized, redirect to appropriate dashboard
    if (user?.roles?.includes('ROLE_DOCTOR')) {
      return <Navigate to="/doctor-dashboard" replace />;
    } else if (user?.roles?.includes('ROLE_PATIENT')) {
      return <Navigate to="/patient-dashboard" replace />;
    }
    // If no specific role found, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute; 