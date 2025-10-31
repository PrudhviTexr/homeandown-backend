import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3, 
  Eye, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Home,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { pyFetch } from '@/utils/backend';
import RoleBasedPropertyForm from '@/components/RoleBasedPropertyForm';

interface DashboardStats {
  total_properties: number;
  active_properties: number;
  total_views: number;
  total_inquiries: number;
  total_bookings: number;
  monthly_earnings: number;
  response_rate: number;
  conversion_rate: number;
}

interface Property {
  id: string;
  title: string;
  property_type: string;
  listing_type: string;
  price?: number;
  monthly_rent?: number;
  city: string;
  state: string;
  status: string;
  images?: string[];
  inquiries_count: number;
  bookings_count: number;
  views_count: number;
  created_at: string;
  assigned_agent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface Inquiry {
  id: string;
  property_id: string;
  user_id: string;
  message: string;
  status: string;
  created_at: string;
  property: Property;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Booking {
  id: string;
  property_id: string;
  user_id: string;
  tour_date: string;
  status: string;
  created_at: string;
  property: Property;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const SellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'inquiries' | 'bookings'>('overview');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [inquiryFilter, setInquiryFilter] = useState<string>('all');
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const fetchOptions = {
        useApiKey: false,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      };

      // Fetch stats using pyFetch
      const statsData = await pyFetch('/api/seller/dashboard/stats', fetchOptions);
      if (statsData?.stats) {
        setStats(statsData.stats);
      }

      // Fetch properties
      const propertiesData = await pyFetch('/api/seller/properties', fetchOptions);
      if (propertiesData?.properties) {
        setProperties(propertiesData.properties);
      }

      // Fetch inquiries
      const inquiriesData = await pyFetch('/api/seller/inquiries', fetchOptions);
      if (inquiriesData?.inquiries) {
        setInquiries(inquiriesData.inquiries);
      }

      // Fetch bookings
      const bookingsData = await pyFetch('/api/seller/bookings', fetchOptions);
      if (bookingsData?.bookings) {
        setBookings(bookingsData.bookings);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingStatusUpdate = async (bookingId: string, newStatus: string, newDate?: string) => {
    try {
      await pyFetch(`/api/seller/bookings/${bookingId}/update-status`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          tour_date: newDate,
          notes: `Status updated to ${newStatus}`
        }),
        useApiKey: false
      });
      toast.success(`Booking ${newStatus} successfully`);
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast.error(error.message || 'Failed to update booking status');
    }
  };

  const handleInquiryResponse = async (inquiryId: string, responseMessage: string) => {
    try {
      await pyFetch(`/api/seller/inquiries/${inquiryId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          message: responseMessage
        }),
        useApiKey: false
      });
      toast.success('Response sent successfully');
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error responding to inquiry:', error);
      toast.error(error.message || 'Failed to send response');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'confirmed':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPropertyTypeDisplay = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="text-gray-600">Manage your properties and track performance</p>
            </div>
            <button
              onClick={() => setShowAddPropertyModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_properties}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_views}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_inquiries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_bookings}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'properties', label: 'Properties', icon: Home },
                { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
                { id: 'bookings', label: 'Bookings', icon: Calendar },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Properties</span>
                        <span className="font-semibold text-blue-600">{stats.total_properties}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Properties</span>
                        <span className="font-semibold text-green-600">{stats.active_properties}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Response Rate</span>
                        <span className="font-semibold text-blue-600">{stats.response_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Conversion Rate</span>
                        <span className="font-semibold text-green-600">{stats.conversion_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Monthly Earnings</span>
                        <span className="font-semibold text-purple-600">{formatPrice(stats.monthly_earnings)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {inquiries.slice(0, 3).map((inquiry) => (
                      <div key={inquiry.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">New inquiry for {inquiry.property.title}</p>
                            <p className="text-sm text-gray-600">{formatDate(inquiry.created_at)}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                      </div>
                    ))}
                    {bookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">Booking for {booking.property.title}</p>
                            <p className="text-sm text-gray-600">{formatDate(booking.tour_date)}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Your Properties</h3>
                  <select
                    value={propertyFilter}
                    onChange={(e) => setPropertyFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all">All Properties</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties
                    .filter(prop => propertyFilter === 'all' || prop.status === propertyFilter)
                    .map((property) => (
                    <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900 truncate">{property.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                            {property.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {getPropertyTypeDisplay(property.property_type)} • {property.city}, {property.state}
                        </p>
                        <p className="text-lg font-bold text-blue-600 mb-3">
                          {property.listing_type === 'RENT' 
                            ? formatPrice(property.monthly_rent) + '/month'
                            : formatPrice(property.price)
                          }
                        </p>
                        {property.assigned_agent && (
                          <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Assigned Agent:</p>
                            <p className="text-sm font-semibold text-blue-900">{property.assigned_agent.name}</p>
                            <p className="text-xs text-gray-600">{property.assigned_agent.email}</p>
                            {property.assigned_agent.phone && (
                              <p className="text-xs text-gray-600">
                                <Phone className="w-3 h-3 inline mr-1" />
                                {property.assigned_agent.phone}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {property.views_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {property.inquiries_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {property.bookings_count}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.href = `/edit-property/${property.id}`}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => window.location.href = `/property/${property.id}`}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inquiries Tab */}
            {activeTab === 'inquiries' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Property Inquiries</h3>
                  <select
                    value={inquiryFilter}
                    onChange={(e) => setInquiryFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all">All Inquiries</option>
                    <option value="pending">Pending</option>
                    <option value="responded">Responded</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {inquiries
                    .filter(inquiry => inquiryFilter === 'all' || inquiry.status === inquiryFilter)
                    .map((inquiry) => (
                    <div key={inquiry.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{inquiry.property.title}</h4>
                          <p className="text-sm text-gray-600">{inquiry.property.city}, {inquiry.property.state}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-700 mb-2">{inquiry.message}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          {inquiry.user.first_name} {inquiry.user.last_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {inquiry.user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {formatDate(inquiry.created_at)}
                        </div>
                      </div>

                      {inquiry.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const response = prompt('Enter your response:');
                              if (response) {
                                handleInquiryResponse(inquiry.id, response);
                              }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Respond
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Property Bookings</h3>
                  <select
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all">All Bookings</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {bookings
                    .filter(booking => bookingFilter === 'all' || booking.status === bookingFilter)
                    .map((booking) => (
                    <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{booking.property.title}</h4>
                          <p className="text-sm text-gray-600">{booking.property.city}, {booking.property.state}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Users className="w-4 h-4" />
                          {booking.user.first_name} {booking.user.last_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Mail className="w-4 h-4" />
                          {booking.user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          Tour Date: {formatDate(booking.tour_date)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          Booked: {formatDate(booking.created_at)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirm
                            </button>
                            <button
                              onClick={() => handleBookingStatusUpdate(booking.id, 'cancelled')}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleBookingStatusUpdate(booking.id, 'completed')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Property Modal */}
      <RoleBasedPropertyForm
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onSuccess={() => {
          setShowAddPropertyModal(false);
          fetchDashboardData(); // Refresh the dashboard data
        }}
        mode="add"
      />
    </div>
  );
};

export default SellerDashboard;