import React, { useState, useEffect } from 'react';
import { Plus, Wrench, Clock, CheckCircle, AlertCircle, Camera, FileText } from 'lucide-react';
// Use Python API endpoints for maintenance in future.
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { toast } from 'react-hot-toast';
import { pyFetch } from '@/utils/backend';

interface MaintenanceRequest {
  id: string;
  property_id: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  estimated_cost?: number;
  completion_date?: string;
}

const MaintenanceRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    property_id: '',
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM' as const
  });

  const categories = [
    'Plumbing',
    'Electrical',
    'HVAC',
    'Painting',
    'Appliances',
    'Flooring',
    'Roofing',
    'Garden/Landscaping',
    'Security',
    'Other'
  ];

  useEffect(() => {
    if (user) {
      fetchMaintenanceRequests();
    }
  }, [user]);

  const fetchMaintenanceRequests = async () => {
    try {
      // Fetch maintenance requests from Python API
      try {
        const response = await pyFetch(`/maintenance?tenant_id=${user?.id}`, {
          method: 'GET',
          useApiKey: false
        });
        setRequests(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Failed to fetch maintenance requests:', error);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Submit maintenance request to Python API
      const requestData = {
        ...newRequest,
        tenant_id: user?.id,
        status: 'PENDING'
      };

      const response = await pyFetch('/maintenance', {
        method: 'POST',
        body: JSON.stringify(requestData),
        useApiKey: false
      });

      // Add to local state
      setRequests(prev => [response, ...prev]);
      setShowNewRequestModal(false);
      setNewRequest({
        property_id: '',
        title: '',
        description: '',
        category: '',
        priority: 'MEDIUM'
      });
      toast.success('Maintenance request submitted successfully.');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit maintenance request');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'IN_PROGRESS': return <Wrench className="w-5 h-5 text-blue-500" />;
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'CANCELLED': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-28 pb-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90C641]"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Requests</h1>
              <p className="text-gray-600">Track and manage maintenance requests for your properties</p>
            </div>
            <button
              onClick={() => setShowNewRequestModal(true)}
              className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Request
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'PENDING').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'IN_PROGRESS').length}
                  </p>
                </div>
                <Wrench className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'COMPLETED').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Requests List */}
          {requests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Maintenance Requests</h3>
              <p className="text-gray-600 mb-6">You haven't submitted any maintenance requests yet.</p>
              <button
                onClick={() => setShowNewRequestModal(true)}
                className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors"
              >
                Submit Your First Request
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(request.status)}
                        <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{request.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Category: {request.category}</span>
                        <span>•</span>
                        <span>Created: {formatDate(request.created_at)}</span>
                        {request.estimated_cost && (
                          <>
                            <span>•</span>
                            <span>Est. Cost: ₹{request.estimated_cost.toLocaleString()}</span>
                          </>
                        )}
                        {request.completion_date && (
                          <>
                            <span>•</span>
                            <span>Completed: {formatDate(request.completion_date)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        request.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit Maintenance Request</h2>
              
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Property</label>
                  <select
                    value={newRequest.property_id}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, property_id: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    required
                  >
                    <option value="">Select Property</option>
                    <option value="prop1">3BHK Apartment in Gachibowli</option>
                    <option value="prop2">2BHK Independent House in Bangalore</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Title*</label>
                  <input
                    type="text"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Category*</label>
                  <select
                    value={newRequest.category}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Priority*</label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Description*</label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    placeholder="Detailed description of the maintenance issue..."
                    required
                  />
                </div>
                
                {/* Photo Upload Placeholder */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Add photos to help explain the issue</p>
                  <button
                    type="button"
                    className="mt-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Upload Photos
                  </button>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#90C641] text-white rounded-lg hover:bg-[#7DAF35] transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MaintenanceRequests;