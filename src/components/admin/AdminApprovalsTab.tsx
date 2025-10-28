import React, { useState, useEffect } from 'react';
import { AdminApi } from '@/services/pyApi';
import { UserCheck, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminApprovalsTabProps {
  onRefresh?: () => void;
}

const AdminApprovalsTab: React.FC<AdminApprovalsTabProps> = ({ onRefresh }) => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingProperties, setPendingProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      setLoading(true);
      
      // Fetch users and properties
      const [usersData, propertiesData] = await Promise.all([
        AdminApi.users(),
        AdminApi.properties()
      ]);

      // Filter pending users
      const pendingUsers = (usersData || []).filter((user: any) => 
        user.verification_status === 'pending'
      );
      
      // Filter pending properties
      const pendingProperties = (propertiesData || []).filter((property: any) => 
        !property.verified
      );

      setPendingUsers(pendingUsers);
      setPendingProperties(pendingProperties);
    } catch (error) {
      console.error('Error fetching pending items:', error);
      toast.error('Failed to load pending items');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      setProcessing(userId);
      await AdminApi.updateUser(userId, { verification_status: 'verified' });
      toast.success('User approved successfully');
      fetchPendingItems();
      onRefresh?.();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    } finally {
      setProcessing(null);
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      setProcessing(userId);
      await AdminApi.updateUser(userId, { verification_status: 'rejected' });
      toast.success('User rejected');
      fetchPendingItems();
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    } finally {
      setProcessing(null);
    }
  };

  const approveProperty = async (propertyId: string) => {
    try {
      setProcessing(propertyId);
      await AdminApi.approveProperty(propertyId);
      toast.success('Property approved successfully');
      fetchPendingItems();
      onRefresh?.();
    } catch (error) {
      console.error('Error approving property:', error);
      toast.error('Failed to approve property');
    } finally {
      setProcessing(null);
    }
  };

  const rejectProperty = async (propertyId: string) => {
    try {
      setProcessing(propertyId);
      await AdminApi.rejectProperty(propertyId, 'Property does not meet quality standards');
      toast.success('Property rejected');
      fetchPendingItems();
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting property:', error);
      toast.error('Failed to reject property');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
        <span className="ml-2">Loading pending approvals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Approvals</h2>
          <p className="text-gray-600 mt-1">
            Review and approve pending users and properties
          </p>
        </div>
        <button 
          onClick={fetchPendingItems} 
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Users</p>
              <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Properties</p>
              <p className="text-2xl font-bold text-gray-900">{pendingProperties.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Users */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Pending User Approvals</span>
          </h3>
        </div>
        <div className="p-6">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending user approvals
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{user.user_type}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      onClick={() => approveUser(user.id)}
                      disabled={processing === user.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1 inline" />
                      Approve
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      onClick={() => rejectUser(user.id)}
                      disabled={processing === user.id}
                    >
                      <XCircle className="h-4 w-4 mr-1 inline" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Properties */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Pending Property Approvals</span>
          </h3>
        </div>
        <div className="p-6">
          {pendingProperties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending property approvals
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProperties.map((property) => (
                <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{property.title}</div>
                    <div className="text-sm text-gray-500">
                      {property.city}, {property.state}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{property.property_type}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{property.listing_type}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ₹{property.price?.toLocaleString() || property.monthly_rent?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      onClick={() => approveProperty(property.id)}
                      disabled={processing === property.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1 inline" />
                      Approve
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      onClick={() => rejectProperty(property.id)}
                      disabled={processing === property.id}
                    >
                      <XCircle className="h-4 w-4 mr-1 inline" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Approval Guidelines</h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• Review user profiles and documents before approval</li>
              <li>• Verify property details and images are accurate</li>
              <li>• Check for compliance with platform policies</li>
              <li>• Approved items will be visible to users immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApprovalsTab;