import React, { useState } from 'react';
import { Shield, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { pyFetch } from '@/utils/backend';
import toast from 'react-hot-toast';

interface RoleRequestComponentProps {
  userRoles: string[];
  onRoleUpdate?: () => void;
}

const RoleRequestComponent: React.FC<RoleRequestComponentProps> = ({ 
  userRoles, 
  onRoleUpdate 
}) => {
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const availableRoles = ['buyer', 'seller', 'agent', 'admin'].filter(
    role => !userRoles.includes(role)
  );

  const handleRequestRole = async (role: string) => {
    try {
      setLoading(true);
      
      const response = await pyFetch('/api/auth/request-role', {
        method: 'POST',
        body: JSON.stringify({ role })
      });

      if (response.success) {
        toast.success(response.message || 'Role request submitted successfully. An admin will review your request.');
        setShowRequestModal(false);
        setSelectedRole('');
        onRoleUpdate?.();
      } else {
        toast.error(response.error || 'Failed to request role');
      }
    } catch (error: any) {
      console.error('Error requesting role:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to request role. Please try again.';
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        errorMessage = 'Role request feature is temporarily unavailable. Please contact support.';
      } else if (error.message?.includes('NetworkError')) {
        errorMessage = 'Unable to reach the server. Please check your internet connection.';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'buyer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'seller':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'agent':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'buyer':
        return '🏠';
      case 'seller':
        return '🏘️';
      case 'agent':
        return '🤝';
      case 'admin':
        return '👑';
      default:
        return '👤';
    }
  };

  if (availableRoles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            Your Roles
          </h3>
        </div>
        
        <div className="space-y-3">
          {userRoles.map((role) => (
            <div
              key={role}
              className={`flex items-center justify-between p-3 rounded-lg border ${getRoleColor(role)}`}
            >
              <div className="flex items-center">
                <span className="text-lg mr-3">{getRoleIcon(role)}</span>
                <div>
                  <span className="font-medium capitalize">{role}</span>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    <span className="text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">
              You have access to all available roles
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-600" />
          Your Roles
        </h3>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Request Role
        </button>
      </div>
      
      <div className="space-y-3">
        {userRoles.map((role) => (
          <div
            key={role}
            className={`flex items-center justify-between p-3 rounded-lg border ${getRoleColor(role)}`}
          >
            <div className="flex items-center">
              <span className="text-lg mr-3">{getRoleIcon(role)}</span>
              <div>
                <span className="font-medium capitalize">{role}</span>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  <span className="text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Available Roles</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableRoles.map((role) => (
              <div
                key={role}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center">
                  <span className="text-lg mr-3">{getRoleIcon(role)}</span>
                  <span className="font-medium capitalize text-gray-700">{role}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedRole(role);
                    setShowRequestModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Request
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Request {selectedRole || 'New'} Role
              </h3>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedRole('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    Role Request Process
                  </p>
                  <p className="text-sm text-blue-700">
                    Your request will be reviewed by our admin team. You'll receive an email notification once approved.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">What you'll get with {selectedRole} role:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {selectedRole === 'seller' && (
                    <>
                      <li>• List and manage your properties</li>
                      <li>• Receive inquiries from potential buyers</li>
                      <li>• Access to property analytics</li>
                    </>
                  )}
                  {selectedRole === 'agent' && (
                    <>
                      <li>• Manage multiple properties</li>
                      <li>• Access to agent dashboard</li>
                      <li>• Handle client inquiries and bookings</li>
                      <li>• Commission tracking</li>
                    </>
                  )}
                  {selectedRole === 'admin' && (
                    <>
                      <li>• Full system access</li>
                      <li>• User and property management</li>
                      <li>• System analytics and reports</li>
                      <li>• Role approval capabilities</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedRole('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestRole(selectedRole)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Requesting...
                  </div>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleRequestComponent;
