import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import role-based signup components
import BuyerSignup from './auth/BuyerSignup';
import SellerSignup from './auth/SellerSignup';
import AgentSignup from './auth/AgentSignup';
import SignIn from './auth/SignIn';

const getModalTitle = (mode: string, userType: string) => {
  if (mode === 'signin') {
    return `Sign In as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`;
  }
  return `Join as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`;
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  userType?: 'buyer' | 'seller' | 'agent';
  redirectTo?: string;
  requireTermsAcceptance?: boolean;
  enableDocumentUpload?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  userType = 'buyer',
  redirectTo = '',
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [success, setSuccess] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<'buyer' | 'seller' | 'agent'>(userType);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedUserType(userType);
      setSuccess(false);
    }
  }, [isOpen, initialMode, userType]);

  const toggleMode = () => {
    setMode(prev => prev === 'signin' ? 'signup' : 'signin');
  };

  const handleSuccess = () => {
    setSuccess(true);

    // Redirect after successful authentication
    setTimeout(() => {
      onClose();
      if (redirectTo) {
        navigate(redirectTo);
      }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-[#162e5a] p-8 text-white text-center relative ">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
          >
            <X size={28} />
          </button>
          <h2 className="text-3xl font-bold mb-2">{getModalTitle(mode, selectedUserType)}</h2>
          <p className="text-white/90 text-lg">
            {mode === 'signin'
              ? 'Welcome back! Please sign in to continue.'
              : 'Create your account to get started.'}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-[#162e5a] mb-2">
              {mode === 'signin' ? 'Sign In Successful!' : 'Account Created!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {mode === 'signin'
                ? 'You have successfully signed in to your account.'
                : 'Your account has been created successfully.'}
            </p>
            <p className="text-sm text-gray-500">Redirecting you...</p>
          </div>
        )}

        {/* Auth Forms */}
        {!success && mode === 'signin' && (
          <SignIn
            onSuccess={handleSuccess}
            onToggleMode={toggleMode}
          />
        )}

        {!success && mode === 'signup' && selectedUserType === 'buyer' && (
          <BuyerSignup
            onToggleMode={toggleMode}
          />
        )}

        {!success && mode === 'signup' && selectedUserType === 'seller' && (
          <SellerSignup
            onToggleMode={toggleMode}
          />
        )}

        {!success && mode === 'signup' && selectedUserType === 'agent' && (
          <AgentSignup
            onToggleMode={toggleMode}
          />
        )}

        {/* User Type Buttons */}
        {!success && (
          <div className="px-8 pb-6">
            <div className="flex justify-center flex-wrap gap-3 mt-6">
              {['buyer', 'seller', 'agent'].map((type) => {
                const colorMap: Record<string, string> = {
                  buyer: 'bg-[#162e5a]',
                  seller: 'bg-green-600',
                  agent: 'bg-purple-600',
                };
                const isSelected = selectedUserType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedUserType(type as 'buyer' | 'seller' | 'agent')}
                    className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isSelected ? `${colorMap[type]} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>

  );
};

export default AuthModal;