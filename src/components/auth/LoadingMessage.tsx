import React from 'react';
import { Clock, Mail, CheckCircle } from 'lucide-react';

interface LoadingMessageProps {
  userType: string;
  step: 'creating' | 'sending_email' | 'complete';
}

const LoadingMessage: React.FC<LoadingMessageProps> = ({ userType, step }) => {
  const getMessage = () => {
    switch (step) {
      case 'creating':
        return {
          title: 'Creating Your Account...',
          description: 'Please wait while we set up your profile.',
          icon: <Clock className="w-6 h-6 text-blue-500 animate-spin" />
        };
      case 'sending_email':
        return {
          title: 'Sending Verification Email...',
          description: 'We\'re sending a verification link to your email address.',
          icon: <Mail className="w-6 h-6 text-blue-500 animate-pulse" />
        };
      case 'complete':
        return {
          title: 'Account Created Successfully!',
          description: getSuccessMessage(userType),
          icon: <CheckCircle className="w-6 h-6 text-green-500" />
        };
      default:
        return {
          title: 'Processing...',
          description: 'Please wait.',
          icon: <Clock className="w-6 h-6 text-blue-500 animate-spin" />
        };
    }
  };

  const getSuccessMessage = (type: string) => {
    switch (type) {
      case 'agent':
        return 'Please check your email to verify your account. After verification, your application will be reviewed by our admin team.';
      case 'seller':
        return 'Please check your email to verify your account. After verification, your business documents will be reviewed by our admin team.';
      default:
        return 'Please check your email to verify your account before signing in.';
    }
  };

  const message = getMessage();

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          {message.icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {message.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {message.description}
        </p>
        {step === 'complete' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Next Steps:</strong> Check your email inbox (including spam folder) and click the verification link to activate your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingMessage;