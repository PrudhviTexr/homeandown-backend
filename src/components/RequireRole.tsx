import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RequireRoleProps {
  children: React.ReactNode;
  role: string | string[];
}

const RequireRole: React.FC<RequireRoleProps> = ({ children, role }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user has the required role
  const roles = Array.isArray(role) ? role : [role];
  
  if (!roles.includes(user.role || '')) {
    // Redirect to appropriate dashboard based on role
    const dashboardRoute = user.role === 'super_admin' ? '/superadmin' : 
                          user.role === 'admin' ? '/admin' : '/employee';
    return <Navigate to={dashboardRoute} replace />;
  }
  
  return <>{children}</>;
};

export default RequireRole;