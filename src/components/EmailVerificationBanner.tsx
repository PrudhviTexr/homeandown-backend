import React, { useState, useEffect } from 'react';
import { Mail, X, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { pyFetch } from '@/utils/backend';
// import { getVerificationEmailTemplate } from '@/utils/emailVerification';

const EmailVerificationBanner: React.FC = () => {
  const { user, getUserProfile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (user) {
        try {
          // Always fetch fresh profile to get latest email_verified status
          const profile = await getUserProfile(true); // Force refresh
          
          // CRITICAL FIX: Only show banner for users who are actually not verified
          // Check both the profile and user object for email_verified status
          const isVerified = profile?.email_verified === true || user?.email_verified === true;
          
          console.log(`[EMAIL_BANNER] Email verification check:`, {
            profileVerified: profile?.email_verified,
            userVerified: user?.email_verified,
            finalIsVerified: isVerified,
            userEmail: user?.email
          });
          
          // IMPORTANT: Only show banner if email is explicitly NOT verified
          // If verification status is undefined/null, assume verified (don't show banner)
          const shouldShowBanner = isVerified === false || 
                                   (profile?.email_verified === false && user?.email_verified === false);
          
          setIsVisible(shouldShowBanner);
          
        } catch (error) {
          console.error('[EMAIL_BANNER] Error checking email verification:', error);
          // CHANGED: If we can't check, assume verified (don't show banner)
          // This prevents the banner from showing unnecessarily
          setIsVisible(false);
        }
      } else {
        setIsVisible(false);
      }
    };

    checkEmailVerification();
    // Also check periodically in case verification happens in another tab
    const interval = setInterval(checkEmailVerification, 30000); // Check every 30 seconds (less frequent)
    return () => clearInterval(interval);
  }, [user, getUserProfile]);

  const handleResendVerification = async () => {
    if (!user) return;

    setIsResending(true);
    try {
  await pyFetch(`/api/auth/resend-verification?email=${encodeURIComponent(user.email)}`, { method: 'POST', useApiKey: true });

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error('Error resending verification email:', error);
      alert('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Mail className="h-4 w-4 text-yellow-400 mr-2" />
          <div>
            <p className="text-xs font-medium text-yellow-800">
              Please verify your email address
            </p>
            <p className="text-xs text-yellow-700">
              We've sent a verification link to <strong>{user?.email}</strong>. 
              Check your inbox and click the link to verify your account.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {resendSuccess ? (
            <div className="flex items-center text-green-600">
              <CheckCircle size={14} className="mr-1" />
              <span className="text-xs">Sent!</span>
            </div>
          ) : (
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-medium disabled:opacity-50 flex items-center"
            >
              {isResending ? (
                <>
                  <RefreshCw size={12} className="mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Email'
              )}
            </button>
          )}
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-yellow-400 hover:text-yellow-600 p-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;