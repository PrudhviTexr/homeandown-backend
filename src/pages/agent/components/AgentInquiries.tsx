import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Search,
  Download,
  Calendar,
  Home,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { pyFetch } from '@/utils/backend';
import { formatIndianCurrency } from '@/utils/currency';
import toast from 'react-hot-toast';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Inquiry {
  id: string;
  message: string;
  inquiry_type: string;
  status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'converted';
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone: string;
  property_id: string;
  user_id?: string;
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    price: number;
    monthly_rent: number;
    listing_type: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    area_sqft: number;
    images: string[];
  };
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    user_type: string;
  };
}

interface InquiryStats {
  total: number;
  new: number;
  contacted: number;
  interested: number;
  converted: number;
  not_interested: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

const AgentInquiries: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InquiryStats>({
    total: 0,
    new: 0,
    contacted: 0,
    interested: 0,
    converted: 0,
    not_interested: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inquiries, statusFilter, dateFilter, searchTerm]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      console.log('[AgentInquiries] Fetching inquiries...');
      
      // Fetch inquiries using the agent-specific endpoint
      const response = await pyFetch('/api/agent/inquiries', {
        method: 'GET',
        useApiKey: true
      });
      
      console.log('[AgentInquiries] Raw response:', response);
      
      const inquiriesData = response.inquiries || response || [];
      console.log('[AgentInquiries] Inquiries data:', inquiriesData);
      
      // Use property and user data from API response if available, otherwise fetch separately
      const enhancedInquiries = await Promise.all(inquiriesData.map(async (inquiry: any) => {
        try {
          // Use property from API response if available
          let property = inquiry.property || null;
          if (!property && inquiry.property_id) {
            try {
              property = await pyFetch(`/api/properties/${inquiry.property_id}`, {
                method: 'GET',
                useApiKey: false
              });
            } catch (err) {
              console.log('[AgentInquiries] Could not fetch property:', err);
            }
          }
          
          // Use user from API response if available
          let user = inquiry.user || null;
          if (!user && inquiry.user_id) {
            try {
              user = await pyFetch(`/api/users/${inquiry.user_id}`, {
                method: 'GET',
                useApiKey: false
              });
            } catch (err) {
              console.log('[AgentInquiries] Could not fetch user:', err);
            }
          }
          
          return {
            ...inquiry,
            property,
            user
          };
        } catch (error) {
          console.error('[AgentInquiries] Error enhancing inquiry:', error);
          return inquiry;
        }
      }));
      
      console.log('[AgentInquiries] Enhanced inquiries:', enhancedInquiries);
      setInquiries(enhancedInquiries);
      calculateStats(enhancedInquiries);
      
    } catch (error) {
      console.error('[AgentInquiries] Error fetching inquiries:', error);
      toast.error('Failed to fetch inquiries');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (inquiriesData: Inquiry[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: InquiryStats = {
      total: inquiriesData.length,
      new: inquiriesData.filter(i => i.status === 'new').length,
      contacted: inquiriesData.filter(i => i.status === 'contacted').length,
      interested: inquiriesData.filter(i => i.status === 'interested').length,
      converted: inquiriesData.filter(i => i.status === 'converted').length,
      not_interested: inquiriesData.filter(i => i.status === 'not_interested').length,
      today: inquiriesData.filter(i => {
        const inquiryDate = new Date(i.created_at);
        return inquiryDate >= today;
      }).length,
      thisWeek: inquiriesData.filter(i => {
        const inquiryDate = new Date(i.created_at);
        return inquiryDate >= weekStart;
      }).length,
      thisMonth: inquiriesData.filter(i => {
        const inquiryDate = new Date(i.created_at);
        return inquiryDate >= monthStart;
      }).length
    };
    
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...inquiries];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inquiry => inquiry.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(inquiry => {
            const inquiryDate = new Date(inquiry.created_at);
            return inquiryDate >= today;
          });
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          filtered = filtered.filter(inquiry => {
            const inquiryDate = new Date(inquiry.created_at);
            return inquiryDate >= weekStart;
          });
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(inquiry => {
            const inquiryDate = new Date(inquiry.created_at);
            return inquiryDate >= monthStart;
          });
          break;
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inquiry => 
        inquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.property?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInquiries(filtered);
  };

  const updateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    try {
      await pyFetch(`/api/inquiries/${inquiryId}`, {
        method: 'PUT',
        useApiKey: true,
        body: JSON.stringify({ status: newStatus })
      });
      
      // Update local state
      setInquiries(prev => prev.map(inquiry => 
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
      ));
      
      toast.success(`Inquiry ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      toast.error('Failed to update inquiry status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      contacted: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      interested: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      converted: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      not_interested: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const viewInquiryDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inquiry Management</h1>
          <p className="text-gray-600">Manage and track all property inquiries from potential clients</p>
        </div>
        <button
          onClick={fetchInquiries}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Interested</p>
              <p className="text-2xl font-bold text-gray-900">{stats.interested}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Converted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.converted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by client name, email, property, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="converted">Converted</option>
            <option value="not_interested">Not Interested</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Inquiries ({filteredInquiries.length})
          </h3>
        </div>
        
        {filteredInquiries.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">No inquiries found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
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
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {inquiry.name || inquiry.user?.first_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inquiry.email || inquiry.user?.email || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inquiry.phone || inquiry.user?.phone_number || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {inquiry.property?.title || 'Property'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {inquiry.property?.city || 'N/A'}, {inquiry.property?.state || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {inquiry.property?.listing_type === 'RENT' 
                          ? `₹${formatIndianCurrency(inquiry.property?.monthly_rent || 0)}/month`
                          : `₹${formatIndianCurrency(inquiry.property?.price || 0)}`
                        }
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {inquiry.message || 'No message provided'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(inquiry.status)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewInquiryDetails(inquiry)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        
                        {inquiry.status === 'new' && (
                          <>
                            <button
                              onClick={() => updateInquiryStatus(inquiry.id, 'contacted')}
                              className="text-yellow-600 hover:text-yellow-900 flex items-center"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Contact
                            </button>
                            <button
                              onClick={() => updateInquiryStatus(inquiry.id, 'interested')}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Interested
                            </button>
                          </>
                        )}
                        
                        {inquiry.status === 'contacted' && (
                          <>
                            <button
                              onClick={() => updateInquiryStatus(inquiry.id, 'interested')}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Interested
                            </button>
                            <button
                              onClick={() => updateInquiryStatus(inquiry.id, 'converted')}
                              className="text-purple-600 hover:text-purple-900 flex items-center"
                            >
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Convert
                            </button>
                          </>
                        )}
                        
                        {inquiry.status === 'interested' && (
                          <button
                            onClick={() => updateInquiryStatus(inquiry.id, 'converted')}
                            className="text-purple-600 hover:text-purple-900 flex items-center"
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Convert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inquiry Details Modal */}
      {showDetails && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Inquiry Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Client Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Client Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900">{selectedInquiry.name || selectedInquiry.user?.first_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedInquiry.email || selectedInquiry.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{selectedInquiry.phone || selectedInquiry.user?.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">User Type</label>
                      <p className="text-gray-900">{selectedInquiry.user?.user_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Property Information */}
                {selectedInquiry.property && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Home className="h-5 w-5 mr-2" />
                      Property Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Title</label>
                        <p className="text-gray-900">{selectedInquiry.property.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Type</label>
                        <p className="text-gray-900">{selectedInquiry.property.property_type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-gray-900">{selectedInquiry.property.address}, {selectedInquiry.property.city}, {selectedInquiry.property.state}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Price</label>
                        <p className="text-gray-900">
                          {selectedInquiry.property.listing_type === 'RENT' 
                            ? `₹${formatIndianCurrency(selectedInquiry.property.monthly_rent || 0)}/month`
                            : `₹${formatIndianCurrency(selectedInquiry.property.price || 0)}`
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Bedrooms</label>
                        <p className="text-gray-900">{selectedInquiry.property.bedrooms || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Bathrooms</label>
                        <p className="text-gray-900">{selectedInquiry.property.bathrooms || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {/* Property Map */}
                    {selectedInquiry.property.latitude && selectedInquiry.property.longitude && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-600 mb-2 block">Property Location</label>
                        <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                          <MapContainer
                            center={[parseFloat(String(selectedInquiry.property.latitude)) || 17.3850, parseFloat(String(selectedInquiry.property.longitude)) || 78.4867]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            key={`${selectedInquiry.property.latitude}-${selectedInquiry.property.longitude}`}
                          >
                            <TileLayer 
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={[parseFloat(String(selectedInquiry.property.latitude)) || 17.3850, parseFloat(String(selectedInquiry.property.longitude)) || 78.4867]}>
                              <Popup>{selectedInquiry.property.title || 'Property Location'}</Popup>
                            </Marker>
                          </MapContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Inquiry Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Inquiry Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Inquiry Type</label>
                      <p className="text-gray-900">{selectedInquiry.inquiry_type || 'General'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedInquiry.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Submitted On</label>
                      <p className="text-gray-900">{new Date(selectedInquiry.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Updated</label>
                      <p className="text-gray-900">{new Date(selectedInquiry.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600">Message</label>
                    <p className="text-gray-900 mt-1 p-3 bg-white rounded border">{selectedInquiry.message || 'No message provided'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  
                  {selectedInquiry.status === 'new' && (
                    <>
                      <button
                        onClick={() => {
                          updateInquiryStatus(selectedInquiry.id, 'contacted');
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        Mark as Contacted
                      </button>
                      <button
                        onClick={() => {
                          updateInquiryStatus(selectedInquiry.id, 'interested');
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark as Interested
                      </button>
                    </>
                  )}
                  
                  {selectedInquiry.status === 'contacted' && (
                    <>
                      <button
                        onClick={() => {
                          updateInquiryStatus(selectedInquiry.id, 'interested');
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark as Interested
                      </button>
                      <button
                        onClick={() => {
                          updateInquiryStatus(selectedInquiry.id, 'converted');
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Mark as Converted
                      </button>
                    </>
                  )}
                  
                  {selectedInquiry.status === 'interested' && (
                    <button
                      onClick={() => {
                        updateInquiryStatus(selectedInquiry.id, 'converted');
                        setShowDetails(false);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Mark as Converted
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentInquiries;
