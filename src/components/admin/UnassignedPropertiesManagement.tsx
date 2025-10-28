import React, { useState, useEffect } from 'react';
import { pyFetch } from '@/utils/backend';
import toast from 'react-hot-toast';

interface Property {
  id: string;
  title: string;
  price: number;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  listing_type: string;
  status: string;
  potential_commission: number;
  commission_rate: number;
  assignment_status: string;
  created_at: string;
}

interface Assignment {
  id: string;
  property_id: string;
  assignment_type: string;
  status: string;
  attempts: number;
  max_attempts: number;
  current_agent_id: string;
  created_at: string;
  property: Property;
  current_agent: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  property_price: number;
  potential_commission: number;
}

const UnassignedPropertiesManagement: React.FC = () => {
  const [unassignedProperties, setUnassignedProperties] = useState<Property[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [pincode, setPincode] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch unassigned properties
      const propertiesResponse = await pyFetch('/api/admin/properties/unassigned', { useApiKey: true });
      setUnassignedProperties(propertiesResponse?.properties || []);
      
      // Fetch pending assignments
      const assignmentsResponse = await pyFetch('/api/admin/assignments/pending', { useApiKey: true });
      setPendingAssignments(assignmentsResponse?.assignments || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignByPincode = async () => {
    if (!selectedProperty || !pincode) {
      toast.error('Please select a property and enter pincode');
      return;
    }

    try {
      setAssigning(true);
      
      const response = await pyFetch(`/api/admin/properties/${selectedProperty.id}/assign-by-pincode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode }),
        useApiKey: true
      });

      if (response?.success) {
        toast.success('Property assignment started successfully');
        setShowAssignmentModal(false);
        setSelectedProperty(null);
        setPincode('');
        fetchData(); // Refresh data
      } else {
        toast.error('Failed to start property assignment');
      }
      
    } catch (error) {
      console.error('Error assigning property:', error);
      toast.error('Failed to assign property');
    } finally {
      setAssigning(false);
    }
  };

  const handleAcceptAssignment = async (assignmentId: string, agentId: string) => {
    try {
      const response = await pyFetch(`/api/admin/assignments/${assignmentId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId }),
        useApiKey: true
      });

      if (response?.success) {
        toast.success('Assignment accepted successfully');
        fetchData(); // Refresh data
      } else {
        toast.error('Failed to accept assignment');
      }
      
    } catch (error) {
      console.error('Error accepting assignment:', error);
      toast.error('Failed to accept assignment');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'unassigned': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Property Assignment Management</h2>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Unassigned Properties */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Unassigned Properties ({unassignedProperties.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unassignedProperties.map((property) => (
                <tr key={property.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      <div className="text-sm text-gray-500">{property.property_type} - {property.listing_type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{property.city}, {property.state}</div>
                    <div className="text-sm text-gray-500">{property.zip_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(property.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(property.potential_commission)}</div>
                    <div className="text-sm text-gray-500">({(property.commission_rate * 100).toFixed(1)}%)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(property.assignment_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedProperty(property);
                        setShowAssignmentModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Assign by Pincode
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Assignments */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Pending Assignments ({pendingAssignments.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{assignment.property.title}</div>
                      <div className="text-sm text-gray-500">{assignment.property.city}, {assignment.property.state}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {assignment.current_agent ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.current_agent.first_name} {assignment.current_agent.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{assignment.current_agent.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No agent assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assignment.attempts} / {assignment.max_attempts}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(assignment.potential_commission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {assignment.current_agent && (
                      <button
                        onClick={() => handleAcceptAssignment(assignment.id, assignment.current_agent.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Accept Assignment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedProperty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Property by Pincode
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Property:</strong> {selectedProperty.title}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Location:</strong> {selectedProperty.city}, {selectedProperty.state} - {selectedProperty.zip_code}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Commission:</strong> {formatCurrency(selectedProperty.potential_commission)}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Enter pincode (e.g., 500090)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setSelectedProperty(null);
                    setPincode('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignByPincode}
                  disabled={assigning || !pincode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Start Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnassignedPropertiesManagement;
