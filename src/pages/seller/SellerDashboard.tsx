import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { toast } from 'react-hot-toast';
import { pyFetch } from '@/utils/backend';
import RoleBasedPropertyForm from '@/components/RoleBasedPropertyForm';
import SellerHeader from '@/components/seller/SellerHeader';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get initial tab from URL params - check both pathname and search params
  const getTabFromURL = useCallback(() => {
    // Check if we're on a specific route
    if (location.pathname === '/seller/inquiries') {
      return 'inquiries';
    }
    if (location.pathname === '/seller/bookings') {
      return 'bookings';
    }
    // Otherwise check query params
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    return (tab as 'overview' | 'properties' | 'inquiries' | 'bookings') || 'overview';
  }, [location.pathname, location.search]);
  
  const [activeTab, setActiveTabState] = useState<'overview' | 'properties' | 'inquiries' | 'bookings'>(() => {
    // Initialize from URL on mount
    if (location.pathname === '/seller/inquiries') return 'inquiries';
    if (location.pathname === '/seller/bookings') return 'bookings';
    const urlParams = new URLSearchParams(location.search);
    return (urlParams.get('tab') as 'overview' | 'properties' | 'inquiries' | 'bookings') || 'overview';
  });
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [inquiryFilter, setInquiryFilter] = useState<string>('all');
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // Sync tab with URL changes (for navigation from /seller/inquiries or /seller/bookings)
  useEffect(() => {
    const tabFromURL = getTabFromURL();
    if (tabFromURL !== activeTab) {
      setActiveTabState(tabFromURL);
      // Update URL to match if we're on a direct route
      if (location.pathname === '/seller/inquiries' || location.pathname === '/seller/bookings') {
        window.history.replaceState({}, '', `/seller/dashboard?tab=${tabFromURL}`);
      }
    }
  }, [location.pathname, location.search, getTabFromURL, activeTab]);

  // Optimized tab handler - updates URL without causing re-renders
  const handleTabChange = useCallback((tab: 'overview' | 'properties' | 'inquiries' | 'bookings') => {
    setActiveTabState(tab);
    // Update URL - ensure we're on /seller/dashboard with the tab parameter
    const newUrl = `/seller/dashboard?tab=${tab}`;
    window.history.replaceState({}, '', newUrl);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;
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
      fetchingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    // Only fetch if user exists and we haven't fetched yet
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchDashboardData();
    } else if (!user?.id) {
      // Reset fetch flag when user logs out
      hasFetchedRef.current = false;
    }
  }, [user?.id, fetchDashboardData]);

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

  // Memoize the header right action to prevent re-renders
  const headerRightAction = useMemo(() => (
    <button
      onClick={() => setShowAddPropertyModal(true)}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
    >
      <Plus className="w-4 h-4" />
      Add Property
    </button>
  ), []);

  // Get header title and subtitle based on active tab
  const getHeaderInfo = useMemo(() => {
    switch (activeTab) {
      case 'inquiries':
        return {
          title: 'Property Inquiries',
          subtitle: 'View and respond to buyer inquiries'
        };
      case 'bookings':
        return {
          title: 'Property Bookings',
          subtitle: 'Manage property tour bookings'
        };
      case 'properties':
        return {
          title: 'My Properties',
          subtitle: 'Manage your property listings'
        };
      default:
        return {
          title: 'Seller Dashboard',
          subtitle: 'Manage your properties and track performance'
        };
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Always visible, memoized to prevent re-renders */}
      <SellerHeader
        title={getHeaderInfo.title}
        subtitle={getHeaderInfo.subtitle}
        showAddProperty={false}
        rightAction={headerRightAction}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      ) : (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-8">
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
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    {(inquiries.length > 3 || bookings.length > 3) && (
                      <button
                        onClick={() => {
                          if (inquiries.length > 3) {
                            handleTabChange('inquiries');
                          } else if (bookings.length > 3) {
                            handleTabChange('bookings');
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View All →
                      </button>
                    )}
                  </div>
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
                            onClick={() => navigate(`/seller/property/${property.id}`)}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Inquiries</option>
                    <option value="pending">Pending</option>
                    <option value="responded">Responded</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {inquiries
                    .filter(inquiry => inquiryFilter === 'all' || inquiry.status === inquiryFilter)
                    .length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Inquiries Found</h4>
                      <p className="text-gray-600">
                        {inquiryFilter === 'all' 
                          ? "You don't have any inquiries yet. When buyers inquire about your properties, they'll appear here."
                          : `No ${inquiryFilter} inquiries found.`
                        }
                      </p>
                    </div>
                  ) : (
                    inquiries
                      .filter(inquiry => inquiryFilter === 'all' || inquiry.status === inquiryFilter)
                      .map((inquiry) => (
                        <div key={inquiry.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{inquiry.property.title}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {inquiry.property.city}, {inquiry.property.state}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${getStatusColor(inquiry.status)}`}>
                              {inquiry.status}
                            </span>
                          </div>
                          
                          <div className="mb-4 space-y-2">
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-gray-700 text-sm">{inquiry.message}</p>
                            </div>
                            {/* Show only agent info, not buyer info */}
                            {inquiry.property?.assigned_agent ? (
                              <>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Users className="w-4 h-4" />
                                  <span className="font-medium">Agent: {inquiry.property.assigned_agent.name || 'Not Assigned'}</span>
                                </div>
                                {inquiry.property.assigned_agent.phone && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <a href={`tel:${inquiry.property.assigned_agent.phone}`} className="text-blue-600 hover:underline">
                                      {inquiry.property.assigned_agent.phone}
                                    </a>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="w-4 h-4" />
                                <span>No agent assigned</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              Inquired: {formatDate(inquiry.created_at)}
                            </div>
                          </div>

                          {inquiry.status === 'pending' && (
                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                              <button
                                onClick={() => {
                                  const response = prompt('Enter your response:');
                                  if (response) {
                                    handleInquiryResponse(inquiry.id, response);
                                  }
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                              >
                                Respond
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                  )}
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    .length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Found</h4>
                      <p className="text-gray-600">
                        {bookingFilter === 'all' 
                          ? "You don't have any bookings yet. When buyers book tours for your properties, they'll appear here."
                          : `No ${bookingFilter} bookings found.`
                        }
                      </p>
                    </div>
                  ) : (
                    bookings
                      .filter(booking => bookingFilter === 'all' || booking.status === bookingFilter)
                      .map((booking) => (
                        <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{booking.property.title}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {booking.property.city}, {booking.property.state}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                          
                          <div className="mb-4 space-y-2">
                            {/* Show only agent info, not buyer info */}
                            {booking.property?.assigned_agent ? (
                              <>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Users className="w-4 h-4" />
                                  <span className="font-medium">Agent: {booking.property.assigned_agent.name || 'Not Assigned'}</span>
                                </div>
                                {booking.property.assigned_agent.phone && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <a href={`tel:${booking.property.assigned_agent.phone}`} className="text-blue-600 hover:underline">
                                      {booking.property.assigned_agent.phone}
                                    </a>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="w-4 h-4" />
                                <span>No agent assigned</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              Tour Date: {formatDate(booking.tour_date || booking.booking_date || booking.created_at)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              Booked: {formatDate(booking.created_at)}
                            </div>
                            {/* Show booking count if available */}
                            {booking.property?.bookings_count !== undefined && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                Total Bookings for this property: {booking.property.bookings_count}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1 font-medium transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'cancelled')}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm flex items-center gap-1 font-medium transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Cancel
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => handleBookingStatusUpdate(booking.id, 'completed')}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1 font-medium transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

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