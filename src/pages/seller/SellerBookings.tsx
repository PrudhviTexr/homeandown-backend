import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Mail, Phone, Clock, MapPin, Search, Filter, Home, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from '@/components/ui/toast';
import { pyFetch } from '@/utils/backend';

interface Property {
  id: string;
  title: string;
  city: string;
  state: string;
  property_type: string;
  listing_type: string;
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
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  };
}

const SellerBookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchBookings = useCallback(async () => {
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

      const bookingsData = await pyFetch('/api/seller/bookings', fetchOptions);
      if (bookingsData?.bookings) {
        setBookings(bookingsData.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchBookings();
    } else if (!user?.id) {
      hasFetchedRef.current = false;
    }
  }, [user?.id, fetchBookings]);

  const handleBookingStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      await pyFetch(`/api/seller/bookings/${bookingId}/update-status`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          notes: `Status updated to ${newStatus}`
        }),
        useApiKey: false
      });
      toast.success(`Booking ${newStatus} successfully`);
      fetchBookings();
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast.error(error?.message || 'Failed to update booking status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatTourDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = bookingFilter === 'all' || booking.status === bookingFilter;
    const matchesSearch = searchQuery === '' || 
      booking.property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0ca5e9] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/seller/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#90C641] rounded-full flex items-center justify-center mr-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Property Bookings</h1>
                <p className="text-gray-600">Manage property tour bookings</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by property, buyer name, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Bookings</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Found</h4>
                <p className="text-gray-600">
                  {bookingFilter === 'all' && searchQuery === ''
                    ? "You don't have any bookings yet. When buyers book tours for your properties, they'll appear here."
                    : `No ${bookingFilter === 'all' ? '' : bookingFilter} bookings found${searchQuery ? ` matching "${searchQuery}"` : ''}.`
                  }
                </p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1 text-lg">{booking.property.title}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {booking.property.city}, {booking.property.state}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="mb-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{booking.user.first_name} {booking.user.last_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${booking.user.email}`} className="hover:text-blue-600">
                          {booking.user.email}
                        </a>
                      </div>
                      {booking.user.phone_number && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${booking.user.phone_number}`} className="hover:text-blue-600">
                            {booking.user.phone_number}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        Booked: {formatDate(booking.created_at)}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-1">
                        <Calendar className="w-4 h-4" />
                        Tour Scheduled
                      </div>
                      <p className="text-blue-700">{formatTourDate(booking.tour_date)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            if (window.confirm('Confirm this booking?')) {
                              handleBookingStatusUpdate(booking.id, 'confirmed');
                            }
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Cancel this booking?')) {
                              handleBookingStatusUpdate(booking.id, 'cancelled');
                            }
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Mark this booking as completed?')) {
                            handleBookingStatusUpdate(booking.id, 'completed');
                          }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Complete
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/seller/property/${booking.property.id}`)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Home className="w-4 h-4" />
                      View Property
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SellerBookings;

