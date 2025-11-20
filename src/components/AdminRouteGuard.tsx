import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // While the AuthProvider is determining session status, do not redirect.
    if (loading) return;

    const userActiveRoles = (user as any)?.active_roles || [];
    const userType = (user as any)?.user_type || '';

    // If there is no user, redirect to admin login
    if (!user) {
      navigate('/admin/login', { replace: true, state: { from: window.location.pathname } });
      return;
    }

    // Check if user has admin role
    const hasAdminAccess = userActiveRoles.includes('admin') || 
                          (userActiveRoles.length === 0 && String(userType).toLowerCase() === 'admin');

    if (!hasAdminAccess) {
      console.log(`[ADMIN_GUARD] Access denied. User roles: ${userActiveRoles.join(', ')}, Primary type: ${userType}`);
      navigate('/admin/login', { replace: true, state: { from: window.location.pathname } });
      return;
    }
  }, [user, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#061D58] via-[#0A2351] to-[#163169] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not admin, don't render children
  const userActiveRoles = (user as any)?.active_roles || [];
  const userType = (user as any)?.user_type || '';
  
  const hasAdminAccess = userActiveRoles.includes('admin') || 
                        (userActiveRoles.length === 0 && String(userType).toLowerCase() === 'admin');

  if (!user || !hasAdminAccess) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
