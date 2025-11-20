import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, Loader2 } from 'lucide-react';

interface SignupSuccessProps {
  email: string;
  userType: string;
  firstName: string;
  onBackToLogin: () => void;
}

const SignupSuccess: React.FC<SignupSuccessProps> = ({ 
  email, 
  userType, 
  firstName, 
  onBackToLogin 
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to email verification page after 2 seconds
    const timer = setTimeout(() => {
      navigate(`/email-verification?email=${encodeURIComponent(email)}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [email, navigate]);

  const getStatusInfo = (type: string) => {
    switch (type) {
      case 'agent':
        return {
          title: 'Agent Registration Complete!',
          subtitle: 'Your agent application has been submitted successfully',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'seller':
        return {
          title: 'Seller Registration Complete!',
          subtitle: 'Your seller application has been submitted successfully',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      default:
        return {
          title: 'Registration Complete!',
          subtitle: 'Welcome to Home & Own real estate platform',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
    }
  };

  const statusInfo = getStatusInfo(userType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12 text-center">
            <div className="mb-6">
              <CheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">
                {statusInfo.title}
              </h1>
              <p className="text-indigo-100 text-lg">
                Hi {firstName}! {statusInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            {/* Email Status */}
            <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-xl p-6 mb-8`}>
              <div className="flex items-center mb-4">
                <Mail className={`w-6 h-6 ${statusInfo.color} mr-3`} />
                <h3 className={`text-lg font-semibold ${statusInfo.color}`}>
                  Verification Email Sent
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                We've sent a verification code to:
              </p>
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="font-mono text-sm text-gray-800">{email}</span>
                </div>
              </div>
              <div className="flex items-center justify-center bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Loader2 className="w-5 h-5 text-blue-600 mr-3 animate-spin" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    Redirecting to email verification...
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Please enter the verification code sent to your email.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="text-center">
                <button
                  onClick={() => navigate(`/email-verification?email=${encodeURIComponent(email)}`)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Go to Email Verification
                </button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={onBackToLogin}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupSuccess;