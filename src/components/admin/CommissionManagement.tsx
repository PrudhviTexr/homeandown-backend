import React, { useState, useEffect } from 'react';
import { DollarSign, Building2, Users, TrendingUp, Edit, Save, X, Plus, AlertCircle } from 'lucide-react';
import { AdminApi } from '@/services/pyApi';
import toast from 'react-hot-toast';

interface CommissionManagementProps {
  onRefresh?: () => void;
}

interface PropertyCommission {
  id: string;
  title: string;
  price?: number;
  monthly_rent?: number;
  commission_rate?: number;
  commission_type?: string;
  agent_id?: string;
  agent_name?: string;
  city: string;
  state: string;
  status: string;
}

const CommissionManagement: React.FC<CommissionManagementProps> = ({ onRefresh }) => {
  const [properties, setProperties] = useState<PropertyCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [commissionData, setCommissionData] = useState<{[key: string]: {rate: number, type: string}}>({});
  const [stats, setStats] = useState({
    totalProperties: 0,
    propertiesWithCommission: 0,
    totalCommissionPotential: 0,
    averageCommissionRate: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [propertiesData, statsData] = await Promise.all([
        AdminApi.properties(),
        AdminApi.getCommissionSummary()
      ]);

      setProperties(propertiesData || []);
      setStats(statsData || {
        totalProperties: 0,
        propertiesWithCommission: 0,
        totalCommissionPotential: 0,
        averageCommissionRate: 0
      });

    } catch (error) {
      console.error('Error fetching commission data:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCommission = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setCommissionData({
        ...commissionData,
        [propertyId]: {
          rate: property.commission_rate || 0,
          type: property.commission_type || 'percentage'
        }
      });
      setEditingProperty(propertyId);
    }
  };

  const handleSaveCommission = async (propertyId: string) => {
    try {
      const data = commissionData[propertyId];
      if (!data) return;

      await AdminApi.setPropertyCommission(propertyId, {
        commission_rate: data.rate,
        commission_type: data.type
      });

      toast.success('Commission rate updated successfully');
      setEditingProperty(null);
      fetchData();
      onRefresh?.();

    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('Failed to update commission rate');
    }
  };

  const handleCancelEdit = (propertyId: string) => {
    setEditingProperty(null);
    setCommissionData({
      ...commissionData,
      [propertyId]: undefined
    });
  };

  const calculateCommissionAmount = (property: PropertyCommission) => {
    const price = property.price || property.monthly_rent || 0;
    const rate = property.commission_rate || 0;
    return (price * rate) / 100;
  };

  const getAgentName = (agentId: string) => {
    // This would typically come from a users list, but for now we'll use the agent_id
    return agentId ? `Agent ${agentId.substring(0, 8)}...` : 'Unassigned';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
        <span className="ml-2">Loading commission data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commission Management</h2>
          <p className="text-gray-600 mt-1">Set and manage commission rates for all properties</p>
        </div>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh Data
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Commission</p>
              <p className="text-2xl font-bold text-gray-900">{stats.propertiesWithCommission}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Potential</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalCommissionPotential?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageCommissionRate?.toFixed(1) || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Property Commission Settings</h3>
          <p className="text-sm text-gray-600 mt-1">Set commission rates for each property</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-medium text-gray-600">Property</th>
                <th className="text-left p-4 font-medium text-gray-600">Location</th>
                <th className="text-left p-4 font-medium text-gray-600">Price</th>
                <th className="text-left p-4 font-medium text-gray-600">Agent</th>
                <th className="text-left p-4 font-medium text-gray-600">Commission Rate</th>
                <th className="text-left p-4 font-medium text-gray-600">Commission Amount</th>
                <th className="text-left p-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => {
                const isEditing = editingProperty === property.id;
                const currentData = commissionData[property.id];
                const commissionAmount = calculateCommissionAmount(property);
                
                return (
                  <tr key={property.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900">{property.title}</div>
                        <div className="text-sm text-gray-500">{property.id.substring(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-600">
                        {property.city}, {property.state}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-600">
                        ₹{(property.price || property.monthly_rent || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.agent_id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {property.agent_id ? getAgentName(property.agent_id) : 'Unassigned'}
                      </span>
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={currentData?.rate || 0}
                            onChange={(e) => setCommissionData({
                              ...commissionData,
                              [property.id]: {
                                ...currentData,
                                rate: parseFloat(e.target.value) || 0
                              }
                            })}
                            className="w-20 px-2 py-1 border rounded text-sm"
                            placeholder="0.0"
                          />
                          <select
                            value={currentData?.type || 'percentage'}
                            onChange={(e) => setCommissionData({
                              ...commissionData,
                              [property.id]: {
                                ...currentData,
                                type: e.target.value
                              }
                            })}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="percentage">%</option>
                            <option value="fixed">Fixed</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {property.commission_rate || 0}%
                          </span>
                          <span className="text-xs text-gray-500">
                            ({property.commission_type || 'percentage'})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{commissionAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveCommission(property.id)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelEdit(property.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditCommission(property.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit Commission"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Commission Guidelines</h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• Commission rates are typically 1-3% of property value for sales</li>
              <li>• For rentals, commission is usually 1 month's rent</li>
              <li>• Higher-value properties may have lower percentage rates</li>
              <li>• Commission is calculated based on the final sale/rental price</li>
              <li>• Changes take effect immediately and apply to new transactions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Commission Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Set Default Rate</h4>
            <p className="text-sm text-gray-600 mb-3">Apply a standard commission rate to all properties</p>
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              Set 2% Default
            </button>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">High-Value Properties</h4>
            <p className="text-sm text-gray-600 mb-3">Apply lower rates to properties above ₹1 crore</p>
            <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
              Set 1% for High-Value
            </button>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Rental Properties</h4>
            <p className="text-sm text-gray-600 mb-3">Set fixed commission for rental properties</p>
            <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
              Set 1 Month Rent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionManagement;
