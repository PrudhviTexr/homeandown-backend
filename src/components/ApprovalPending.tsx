import React from 'react';
import { AlertCircle, Clock, Mail, Phone } from 'lucide-react';

interface ApprovalPendingProps {
  userType: string;
  email: string;
  onResendVerification?: () => void;
}

const ApprovalPending: React.FC<ApprovalPendingProps> = ({ 
  userType, 
  email, 
  onResendVerification 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account Pending Approval
            </h2>
            <p className="text-gray-600 mb-6">
              Your {userType} account is waiting for admin approval
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">
                  Admin Approval Required
                </h3>
                <p className="text-sm text-yellow-700">
                  Your account has been created successfully, but it needs to be approved by an administrator before you can access the platform.
                </p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Account Details</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Email:</span>
                <span className="ml-2">{email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Account Type:</span>
                <span className="ml-2 capitalize">{userType}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Status:</span>
                <span className="ml-2 text-yellow-600 font-medium">Pending Approval</span>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">What happens next?</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    Our admin team will review your account details and documents
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    You'll receive an email notification once your account is approved
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    You can then login and start using the platform
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h3>
            <p className="text-sm text-blue-800 mb-3">
              If you have any questions or need assistance, please contact our support team.
            </p>
            <div className="flex items-center text-sm text-blue-700">
              <Phone className="h-4 w-4 mr-2" />
              <span>Support: +1 (555) 123-4567</span>
            </div>
            <div className="flex items-center text-sm text-blue-700 mt-1">
              <Mail className="h-4 w-4 mr-2" />
              <span>support@homeandown.com</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {onResendVerification && (
              <button
                onClick={onResendVerification}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Resend Verification Email
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Home
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Approval typically takes 24-48 hours during business days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalPending;
