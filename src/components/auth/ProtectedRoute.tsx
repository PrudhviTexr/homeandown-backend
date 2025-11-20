import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from '@/components/ui/toast';
import React, { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

/**
 * ProtectedRoute component that restricts access based on user roles
 * 
 * @param children - Components to render if user has access
 * @param allowedRoles - Array of user types allowed to access this route
 * @param fallbackPath - Path to redirect if user doesn't have access (default: '/')
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = '/'
}) => {
  const { user, loading, getUserProfile } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = user.user_type && user.email_verified !== undefined ? user : await getUserProfile(true);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
      setProfileLoading(false);
    };
    
    loadProfile();
  }, [user, getUserProfile]);

  // Show loading state while checking authentication
  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Redirect to fallback if no user is authenticated
  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check if user's email is verified
  if (userProfile && !userProfile.email_verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verification Required</h2>
          <p className="text-gray-600 mb-6">
            Please verify your email address to access this feature. Check your inbox for a verification link.
          </p>
          <div className="space-y-3">
            <button
              onClick={async () => {
                try {
                  const { resendVerificationEmail } = await import('@/utils/emailVerification');
                  const result = await resendVerificationEmail(user.email || '');
                  if (result.success) {
                    toast.success('Verification email sent! Please check your inbox.');
                  } else {
                    toast.error(result.error || 'Failed to send verification email');
                  }
                } catch (error) {
                  toast.error('An error occurred while sending verification email');
                }
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Resend Verification Email
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user's role is in the allowed roles list
  const hasAccess = userProfile?.user_type && allowedRoles.includes(userProfile.user_type);

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

/**
 * Hook to check if current user has specific role(s)
 */
export const useRoleCheck = (allowedRoles: string[]): boolean => {
  const { user, getUserProfile } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile();
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };
    
    loadProfile();
  }, [user, getUserProfile]);
  
  if (!user || !userProfile) return false;
  
  return userProfile.user_type && allowedRoles.includes(userProfile.user_type) || false;
};

/**
 * Component that conditionally renders content based on user roles
 */
interface RoleBasedAccessProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback = null
}) => {
  const hasAccess = useRoleCheck(allowedRoles);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};