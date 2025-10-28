import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
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
  MessageCircle,
  Home,
  CalendarDays,
  Users,
  TrendingUp
} from 'lucide-react';
import { pyFetch } from '@/utils/backend';
import { formatIndianCurrency } from '@/utils/currency';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
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

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

const AgentBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, statusFilter, dateFilter, searchTerm]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('[AgentBookings] Fetching bookings...');
      
      // Fetch bookings using the agent-specific endpoint
      const response = await pyFetch('/api/agent/bookings', {
        method: 'GET',
        useApiKey: false
      });
      
      console.log('[AgentBookings] Raw response:', response);
      
      const bookingsData = response.bookings || response || [];
      console.log('[AgentBookings] Bookings data:', bookingsData);
      
      // Enhance bookings with property and user details
      const enhancedBookings = await Promise.all(bookingsData.map(async (booking: any) => {
        try {
          // Get property details
          let property = null;
          if (booking.property_id) {
            try {
              property = await pyFetch(`/api/properties/${booking.property_id}`, {
                method: 'GET',
                useApiKey: false
              });
            } catch (err) {
              console.log('[AgentBookings] Could not fetch property:', err);
            }
          }
          
          // Get user details
          let user = null;
          if (booking.user_id) {
            try {
              user = await pyFetch(`/api/users/${booking.user_id}`, {
                method: 'GET',
                useApiKey: false
              });
            } catch (err) {
              console.log('[AgentBookings] Could not fetch user:', err);
            }
          }
          
          return {
            ...booking,
            property,
            user
          };
        } catch (error) {
          console.error('[AgentBookings] Error enhancing booking:', error);
          return booking;
        }
      }));
      
      console.log('[AgentBookings] Enhanced bookings:', enhancedBookings);
      setBookings(enhancedBookings);
      calculateStats(enhancedBookings);
      
    } catch (error) {
      console.error('[AgentBookings] Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData: Booking[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: BookingStats = {
      total: bookingsData.length,
      pending: bookingsData.filter(b => b.status === 'pending').length,
      confirmed: bookingsData.filter(b => b.status === 'confirmed').length,
      completed: bookingsData.filter(b => b.status === 'completed').length,
      cancelled: bookingsData.filter(b => b.status === 'cancelled').length,
      today: bookingsData.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate >= today;
      }).length,
      thisWeek: bookingsData.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate >= weekStart;
      }).length,
      thisMonth: bookingsData.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate >= monthStart;
      }).length
    };
    
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.created_at);
            return bookingDate >= today;
          });
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.created_at);
            return bookingDate >= weekStart;
          });
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.created_at);
            return bookingDate >= monthStart;
          });
          break;
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.property?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await pyFetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        useApiKey: false,
        body: JSON.stringify({ status: newStatus })
      });
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      
      toast.success(`Booking ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
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
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600">Manage and track all property tour bookings</p>
        </div>
        <button
          onClick={fetchBookings}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
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
                placeholder="Search by client name, email, or property..."
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Bookings ({filteredBookings.length})
          </h3>
        </div>
        
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">No bookings found</p>
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
                    Tour Details
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
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.name || booking.user?.first_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.email || booking.user?.email || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.phone || booking.user?.phone_number || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {booking.property?.title || 'Property'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {booking.property?.city || 'N/A'}, {booking.property?.state || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.property?.listing_type === 'RENT' 
                          ? `₹${formatIndianCurrency(booking.property?.monthly_rent || 0)}/month`
                          : `₹${formatIndianCurrency(booking.property?.price || 0)}`
                        }
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {booking.booking_date || 'TBD'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {booking.booking_time || 'TBD'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewBookingDetails(booking)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </button>
                          </>
                        )}
                        
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
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

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Booking Details</h3>
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
                      <p className="text-gray-900">{selectedBooking.name || selectedBooking.user?.first_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedBooking.email || selectedBooking.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{selectedBooking.phone || selectedBooking.user?.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">User Type</label>
                      <p className="text-gray-900">{selectedBooking.user?.user_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Property Information */}
                {selectedBooking.property && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Home className="h-5 w-5 mr-2" />
                      Property Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Title</label>
                        <p className="text-gray-900">{selectedBooking.property.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Type</label>
                        <p className="text-gray-900">{selectedBooking.property.property_type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-gray-900">{selectedBooking.property.address}, {selectedBooking.property.city}, {selectedBooking.property.state}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Price</label>
                        <p className="text-gray-900">
                          {selectedBooking.property.listing_type === 'RENT' 
                            ? `₹${formatIndianCurrency(selectedBooking.property.monthly_rent || 0)}/month`
                            : `₹${formatIndianCurrency(selectedBooking.property.price || 0)}`
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Bedrooms</label>
                        <p className="text-gray-900">{selectedBooking.property.bedrooms || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Bathrooms</label>
                        <p className="text-gray-900">{selectedBooking.property.bathrooms || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tour Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CalendarDays className="h-5 w-5 mr-2" />
                    Tour Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tour Date</label>
                      <p className="text-gray-900">{selectedBooking.booking_date || 'TBD'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tour Time</label>
                      <p className="text-gray-900">{selectedBooking.booking_time || 'TBD'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Requested On</label>
                      <p className="text-gray-900">{new Date(selectedBooking.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {selectedBooking.notes && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-gray-900 mt-1 p-3 bg-white rounded border">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  
                  {selectedBooking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          updateBookingStatus(selectedBooking.id, 'confirmed');
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Confirm Tour
                      </button>
                      <button
                        onClick={() => {
                          updateBookingStatus(selectedBooking.id, 'cancelled');
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Cancel Tour
                      </button>
                    </>
                  )}
                  
                  {selectedBooking.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        updateBookingStatus(selectedBooking.id, 'completed');
                        setShowDetails(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Mark Complete
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

export default AgentBookings;
