
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { users } from '../../utils/api';

const PrivateRoute = ({ children, requiredRoles = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await users.getCurrentUser();
        if (response.data) {
          setIsAuthenticated(true);
          setUserRole(response.data.role);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Authentication error in PrivateRoute:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]); 

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRequiredRole = requiredRoles.length === 0 || requiredRoles.includes(userRole);

  if (hasRequiredRole) {
    return children;
  }

  if (userRole === 'worker') {
    return <Navigate to="/worker-dashboard" replace />;
  } else if (userRole === 'owner' || userRole === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;