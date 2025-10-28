import React, { useState, useEffect } from 'react';
import { AdminApi } from '@/services/pyApi';
import { User, Shield, UserCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoleManagementTabProps {
  onRefresh?: () => void;
}

const RoleManagementTab: React.FC<RoleManagementTabProps> = ({ onRefresh }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminApi.users();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(userId);
      await AdminApi.updateUser(userId, { user_type: newRole });
      toast.success('User role updated successfully');
      fetchUsers();
      onRefresh?.();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'seller': return 'bg-green-100 text-green-800';
      case 'buyer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (userType: string) => {
    switch (userType) {
      case 'admin': return Shield;
      case 'agent': return UserCheck;
      default: return User;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600 mt-1">
            Manage user roles and permissions across the platform
          </p>
        </div>
        <button 
          onClick={fetchUsers} 
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['admin', 'agent', 'seller', 'buyer'].map((role) => {
          const count = users.filter(u => u.user_type === role).length;
          const Icon = getRoleIcon(role);
          return (
            <div key={role} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{role}s</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-gray-600">User</th>
                <th className="text-left p-3 font-medium text-gray-600">Current Role</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
                      {user.user_type}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.verification_status || 'pending'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      {user.user_type !== 'admin' && (
                        <>
                          <button
                            className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => updateUserRole(user.id, 'agent')}
                            disabled={updating === user.id || user.user_type === 'agent'}
                          >
                            Make Agent
                          </button>
                          <button
                            className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => updateUserRole(user.id, 'seller')}
                            disabled={updating === user.id || user.user_type === 'seller'}
                          >
                            Make Seller
                          </button>
                          <button
                            className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => updateUserRole(user.id, 'buyer')}
                            disabled={updating === user.id || user.user_type === 'buyer'}
                          >
                            Make Buyer
                          </button>
                        </>
                      )}
                      {user.user_type === 'admin' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Role Management Guidelines</h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• <strong>Admin:</strong> Full system access and management capabilities</li>
              <li>• <strong>Agent:</strong> Can manage properties, bookings, and inquiries</li>
              <li>• <strong>Seller:</strong> Can list and manage their own properties</li>
              <li>• <strong>Buyer:</strong> Can browse properties and make inquiries/bookings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementTab;