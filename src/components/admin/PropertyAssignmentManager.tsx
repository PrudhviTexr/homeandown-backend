import React, { useState, useEffect } from 'react';
import { Building2, UserCog, MapPin, DollarSign, Eye, Edit, Trash2, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AdminApi } from '@/services/pyApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import PropertyApprovalModal from './PropertyApprovalModal';
import EditPropertyModal from './EditPropertyModal';


interface PropertyAssignmentManagerProps {
  onRefresh?: () => void;
}

const PropertyAssignmentManager: React.FC<PropertyAssignmentManagerProps> = ({ onRefresh }) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [propertiesData, usersData, bookingsData, inquiriesData] = await Promise.all([
        AdminApi.properties(),
        AdminApi.users(),
        AdminApi.listBookings(),
        AdminApi.listInquiries()
      ]);

      setProperties(propertiesData || []);
      setAgents((usersData || []).filter(u => u.user_type === 'agent'));
      setBookings(bookingsData || []);
      setInquiries(inquiriesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const assignAgentToProperty = async (propertyId: string, agentId: string) => {
    try {
      setAssigning(propertyId);
      await AdminApi.assignAgentToProperty(propertyId, agentId);
      toast.success('Agent assigned successfully');
      fetchAllData();
      onRefresh?.();
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Failed to assign agent');
    } finally {
      setAssigning(null);
    }
  };

  const unassignAgent = async (propertyId: string) => {
    try {
      setAssigning(propertyId);
      await AdminApi.assignAgentToProperty(propertyId, null);
      toast.success('Agent unassigned successfully');
      fetchAllData();
      onRefresh?.();
    } catch (error) {
      console.error('Error unassigning agent:', error);
      toast.error('Failed to unassign agent');
    } finally {
      setAssigning(null);
    }
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown Agent';
  };

  const handleViewProperty = (property: any) => {
    alert(`Attempting to view property: ${property.title}`); // DEBUGGING ALERT
    setSelectedProperty(property);
    setIsViewModalOpen(true);
  };

  const handleEditProperty = (property: any) => {
    alert(`Attempting to edit property: ${property.title}`); // DEBUGGING ALERT
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  const getPropertyStats = (propertyId: string) => {
    const propertyInquiries = inquiries.filter(i => i.property_id === propertyId);
    const propertyBookings = bookings.filter(b => b.property_id === propertyId);
    return {
      inquiries: propertyInquiries.length,
      bookings: propertyBookings.length
    };
  };

  const filteredProperties = properties.filter(property => {
    switch (filter) {
      case 'assigned':
        return property.agent_id;
      case 'unassigned':
        return !property.agent_id;
      default:
        return true;
    }
  });

  const getStats = () => {
    const total = properties.length;
    const assigned = properties.filter(p => p.agent_id).length;
    const unassigned = total - assigned;
    const verified = properties.filter(p => p.verified).length;
    const pending = total - verified;
    
    return { total, assigned, unassigned, verified, pending };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
        <span className="ml-2">Loading property assignments...</span>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Assignment Management</h2>
          <p className="text-gray-600 mt-1">Complete control over property assignments and agent management</p>
        </div>
        <button 
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh Data
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-xl font-bold text-gray-900">{stats.assigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Unassigned</p>
              <p className="text-xl font-bold text-gray-900">{stats.unassigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-xl font-bold text-gray-900">{stats.verified}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Properties ({stats.total})
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'assigned' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Assigned ({stats.assigned})
          </button>
          <button
            onClick={() => setFilter('unassigned')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'unassigned' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unassigned ({stats.unassigned})
          </button>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Property Details & Assignments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-medium text-gray-600">Property</th>
                <th className="text-left p-4 font-medium text-gray-600">Location</th>
                <th className="text-left p-4 font-medium text-gray-600">Price</th>
                <th className="text-left p-4 font-medium text-gray-600">Assigned Agent</th>
                <th className="text-left p-4 font-medium text-gray-600">Status</th>
                <th className="text-left p-4 font-medium text-gray-600">Performance</th>
                <th className="text-left p-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property) => {
                const propertyStats = getPropertyStats(property.id);
                return (
                  <tr key={property.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900">{property.title}</div>
                        <div className="text-sm text-gray-500">{property.property_type}</div>
                        <div className="text-xs text-gray-400">
                          ID: {property.id.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <div>
                          <div>{property.city}, {property.state}</div>
                          {property.zip_code && (
                            <div className="text-xs text-gray-400">{property.zip_code}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <div>
                          <div>₹{property.price?.toLocaleString() || property.monthly_rent?.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">{property.listing_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {property.agent_id ? (
                        <div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getAgentName(property.agent_id)}
                          </span>
                          <div className="text-xs text-gray-400 mt-1">
                            {property.agent_id.substring(0, 8)}...
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          property.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.verified ? 'Verified' : 'Pending'}
                        </span>
                        <div className="text-xs text-gray-400">
                          {property.status || 'active'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <span className="w-16 text-gray-600">Inquiries:</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {propertyStats.inquiries}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-16 text-gray-600">Bookings:</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {propertyStats.bookings}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleViewProperty(property)} className="p-1 text-gray-400 hover:text-blue-600" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleEditProperty(property)} className="p-1 text-gray-400 hover:text-green-600" title="Edit Property">
                          <Edit className="h-4 w-4" />
                        </button>
                        {property.agent_id ? (
                          <button 
                            className="p-1 text-gray-400 hover:text-red-600" 
                            title="Unassign Agent"
                            onClick={() => unassignAgent(property.id)}
                            disabled={assigning === property.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <select
                            className="text-xs border rounded px-2 py-1"
                            onChange={(e) => {
                              if (e.target.value) {
                                assignAgentToProperty(property.id, e.target.value);
                              }
                            }}
                            disabled={assigning === property.id}
                          >
                            <option value="">Assign Agent</option>
                            {agents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.first_name} {agent.last_name}
                              </option>
                            ))}
                          </select>
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

      {/* Unassigned Properties Alert */}
      {stats.unassigned > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-900">Action Required</h3>
              <p className="text-red-800 mt-1">
                {stats.unassigned} properties are not assigned to any agent. 
                These properties may not receive proper customer service.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedProperty && (
        <PropertyApprovalModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          property={selectedProperty}
          onApprovalChange={() => {
            fetchAllData();
            setIsViewModalOpen(false);
          }}
          isReadOnly={true}
        />
      )}

      {selectedProperty && (
        <EditPropertyModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          property={selectedProperty}
          onPropertyUpdated={() => {
            fetchAllData();
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* Agent Performance Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Agent Performance Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const agentProperties = properties.filter(p => p.agent_id === agent.id);
              const agentInquiries = inquiries.filter(i => agentProperties.some(p => p.id === i.property_id));
              const agentBookings = bookings.filter(b => agentProperties.some(p => p.id === b.property_id));
              
              return (
                <div key={agent.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-gray-900">{agent.first_name} {agent.last_name}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agent.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {agent.verification_status || 'pending'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">{agent.email}</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Properties:</span>
                      <span className="font-medium">{agentProperties.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Inquiries:</span>
                      <span className="font-medium">{agentInquiries.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bookings:</span>
                      <span className="font-medium">{agentBookings.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Conversion:</span>
                      <span className="font-medium">
                        {agentInquiries.length > 0 ? Math.round((agentBookings.length / agentInquiries.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyAssignmentManager;
