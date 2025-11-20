import React, { useState, useEffect } from 'react';
import { Eye, UserCheck, Clock, XCircle } from 'lucide-react';
import UserApprovalModal from './UserApprovalModal';
import toast from 'react-hot-toast';
import { AdminApi } from '@/services/pyApi';

interface PendingUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  verification_status: string;
  created_at: string;
  submitted_at?: string;
}

const UserApprovalsTab: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      // Fetch users via Python Admin API and filter for ALL pending users
      const users = (await AdminApi.users()) as any[];
      const filtered = (users || [])
        .filter(u => (u.verification_status || '').toLowerCase() === 'pending')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPendingUsers(filtered);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user: PendingUser) => {
    setSelectedUser(user);
    setShowApprovalModal(true);
  };

  const handleApprovalChange = () => {
    fetchPendingUsers(); // Refresh the list
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'verified':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'agent':
        return 'bg-purple-100 text-purple-800';
      case 'seller':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Approvals</h2>
          <p className="text-gray-600 mt-1">
            Review and approve user applications for all user types (buyers, agents, sellers)
          </p>
        </div>
        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
          {pendingUsers.length} Pending
        </div>
      </div>

      {/* Pending Users List */}
      {pendingUsers.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
          <p className="text-gray-600">All user applications have been processed.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {pendingUsers.map((user) => (
              <li key={user.id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
                            {user.user_type}
                          </span>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(user.verification_status)}
                            <span className="text-xs text-gray-500 capitalize">
                              {user.verification_status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center mt-2 text-sm text-gray-500 space-x-4">
                          <span>{user.email}</span>
                          <span>Applied: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Approval Modal */}
      <UserApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onApprovalChange={handleApprovalChange}
      />
    </div>
  );
};

export default UserApprovalsTab;