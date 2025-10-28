import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ClientRouteGuardProps {
  children: React.ReactNode;
  allowedUserTypes?: string[];
}

const ClientRouteGuard: React.FC<ClientRouteGuardProps> = ({ 
  children, 
  allowedUserTypes = ['buyer', 'seller', 'agent'] 
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated - redirect to login
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }

    const userType = user.user_type?.toLowerCase();
    
    // Check if user type is allowed for this route
    if (!allowedUserTypes.includes(userType)) {
      // User type not allowed - redirect to their appropriate dashboard
      switch (userType) {
        case 'buyer':
          navigate('/buyer/dashboard', { replace: true });
          break;
        case 'seller':
          navigate('/seller/dashboard', { replace: true });
          break;
        case 'agent':
          navigate('/agent/dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate, location, allowedUserTypes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userType = user.user_type?.toLowerCase();
  if (!allowedUserTypes.includes(userType)) {
    return null;
  }

  return <>{children}</>;
};

export default ClientRouteGuard;
