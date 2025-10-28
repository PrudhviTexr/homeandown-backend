import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AgentRouteGuardProps {
  children: React.ReactNode;
}

const AgentRouteGuard: React.FC<AgentRouteGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // While the AuthProvider is determining session status, do not redirect.
    if (loading) return;

    const userActiveRoles = (user as any)?.active_roles || [];
    const userType = (user as any)?.user_type || '';

    // If there is no user, redirect to login
    if (!user) {
      navigate('/login', { replace: true, state: { from: window.location.pathname } });
      return;
    }

    // Check if user has agent role
    const hasAgentAccess = userActiveRoles.includes('agent') || 
                          (userActiveRoles.length === 0 && String(userType).toLowerCase() === 'agent');

    if (!hasAgentAccess) {
      console.log(`[AGENT_GUARD] Access denied. User roles: ${userActiveRoles.join(', ')}, Primary type: ${userType}`);
      navigate('/', { replace: true, state: { from: window.location.pathname } });
      return;
    }
  }, [user, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#061D58] via-[#0A2351] to-[#163169] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Verifying agent access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not agent, don't render children
  const userActiveRoles = (user as any)?.active_roles || [];
  const userType = (user as any)?.user_type || '';
  
  const hasAgentAccess = userActiveRoles.includes('agent') || 
                        (userActiveRoles.length === 0 && String(userType).toLowerCase() === 'agent');

  if (!user || !hasAgentAccess) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};

export default AgentRouteGuard;
