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
  Image as ImageIcon,
  Heart,
  Bookmark,
  Share2
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { pyFetch } from '@/utils/backend';

interface DashboardStats {
  saved_properties: number;
  total_inquiries: number;
  total_bookings: number;
  completed_tours: number;
  pending_bookings: number;
  confirmed_bookings: number;
  favorite_locations: number;
  preferred_property_types: string[];
  response_rate: number;
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
  verified: boolean;
  images?: string[];
  created_at: string;
  is_saved?: boolean;
}

interface Inquiry {
  id: string;
  property_id: string;
  user_id: string;
  message: string;
  status: string;
  created_at: string;
  property: Property;
}

interface Booking {
  id: string;
  property_id: string;
  user_id: string;
  tour_date: string;
  status: string;
  created_at: string;
  property: Property;
}

const BuyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'inquiries' | 'bookings'>('overview');
  const [inquiryFilter, setInquiryFilter] = useState<string>('all');
  const [bookingFilter, setBookingFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsData = await pyFetch('/api/buyer/dashboard/stats', { useApiKey: false });
      setStats(statsData.stats);

      // Fetch saved properties
      const savedData = await pyFetch('/api/buyer/saved-properties', { useApiKey: false });
      setSavedProperties(savedData.properties);

      // Fetch inquiries
      const inquiriesData = await pyFetch('/api/buyer/inquiries', { useApiKey: false });
      setInquiries(inquiriesData.inquiries);

      // Fetch bookings
      const bookingsData = await pyFetch('/api/buyer/bookings', { useApiKey: false });
      setBookings(bookingsData.bookings);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProperty = async (propertyId: string) => {
    try {
      await pyFetch('/api/buyer/save-property', {
        method: 'POST',
        body: JSON.stringify({ property_id: propertyId }),
        useApiKey: false
      });

      toast.success('Property saved to favorites');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Failed to save property');
    }
  };

  const handleUnsaveProperty = async (propertyId: string) => {
    try {
      await pyFetch(`/api/buyer/unsave-property/${propertyId}`, {
        method: 'DELETE',
        useApiKey: false
      });

      toast.success('Property removed from favorites');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error removing property:', error);
      toast.error('Failed to remove property');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const reason = prompt('Please provide a reason for cancellation:');
      if (!reason) return;

      await pyFetch(`/api/buyer/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
        useApiKey: false
      });

      toast.success('Booking cancelled successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleRescheduleBooking = async (bookingId: string) => {
    try {
      const newDate = prompt('Enter new tour date (YYYY-MM-DD):');
      if (!newDate) return;

      const notes = prompt('Additional notes (optional):') || '';

      await pyFetch(`/api/buyer/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ 
          tour_date: newDate,
          notes 
        }),
        useApiKey: false
      });

      toast.success('Booking rescheduled successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      toast.error('Failed to reschedule booking');
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
              <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
              <p className="text-gray-600">Track your property search and bookings</p>
            </div>
            <button
              onClick={() => window.location.href = '/buy'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Browse Properties
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
                  <Heart className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Saved Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.saved_properties}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_inquiries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_bookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed Tours</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed_tours}</p>
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
                { id: 'saved', label: 'Saved Properties', icon: Heart },
                { id: 'inquiries', label: 'My Inquiries', icon: MessageSquare },
                { id: 'bookings', label: 'My Bookings', icon: Calendar },
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Preferences</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Favorite Locations</span>
                        <span className="font-semibold text-blue-600">{stats.favorite_locations}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Preferred Types</span>
                        <span className="font-semibold text-green-600">{stats.preferred_property_types.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Response Rate</span>
                        <span className="font-semibold text-purple-600">{stats.response_rate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Pending Bookings</span>
                        <span className="font-semibold text-yellow-600">{stats.pending_bookings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Confirmed Bookings</span>
                        <span className="font-semibold text-green-600">{stats.confirmed_bookings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Completed Tours</span>
                        <span className="font-semibold text-blue-600">{stats.completed_tours}</span>
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
                            <p className="font-medium text-gray-900">Inquiry for {inquiry.property.title}</p>
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

            {/* Saved Properties Tab */}
            {activeTab === 'saved' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Your Saved Properties</h3>
                  <span className="text-sm text-gray-600">{savedProperties.length} properties</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {savedProperties.map((property) => (
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
                          <button
                            onClick={() => handleUnsaveProperty(property.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Heart className="w-5 h-5 fill-current" />
                          </button>
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.href = `/property/${property.id}`}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => window.location.href = `/property/${property.id}#inquiry`}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                          >
                            Inquire
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
                  <h3 className="text-lg font-semibold text-gray-900">Your Property Inquiries</h3>
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
                          <Clock className="w-4 h-4" />
                          {formatDate(inquiry.created_at)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.href = `/property/${inquiry.property.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                        >
                          View Property
                        </button>
                        <button
                          onClick={() => handleSaveProperty(inquiry.property.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                        >
                          <Heart className="w-4 h-4" />
                          Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Your Property Bookings</h3>
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
                          <Calendar className="w-4 h-4" />
                          Tour Date: {formatDate(booking.tour_date)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          Booked: {formatDate(booking.created_at)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.href = `/property/${booking.property.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                        >
                          View Property
                        </button>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleRescheduleBooking(booking.id)}
                              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleRescheduleBooking(booking.id)}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
                          >
                            Reschedule
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
    </div>
  );
};

export default BuyerDashboard;