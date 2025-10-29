import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  User as UserIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ViewBookingModal from '@/components/client/ViewBookingModal';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { pyFetch } from '@/utils/backend';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  created_at: string;
  properties: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    price: number;
    monthly_rent: number;
    listing_type: string;
    images: string[];
    users: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    };
  };
}

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      return; 
    }
    if ((user as any).user_type !== 'buyer') {
      navigate('/');
      return;
    }

    fetchBookings();
    
    // Set up a simple refresh interval instead of real-time subscriptions
    const refreshInterval = setInterval(() => {
      fetchBookings();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [user, navigate, filter]);

  async function fetchBookings() {
    if (!user) return;
    setLoading(true);
    try {
      console.log('[MyBookings] Fetching bookings for user:', user.id);
      
      // Fetch bookings for the current user using pyFetch
      const userId = (user as any).id;
      const data = await pyFetch(`/api/records/bookings?user_id=${encodeURIComponent(userId)}`, { 
        method: 'GET', 
        useApiKey: false 
      });
      
      console.log('[MyBookings] Raw bookings data:', data);
      
      // Filter bookings for current user
      const userBookings = (data || []).filter((booking: any) => 
        booking.user_id === user.id || booking.email === user.email
      );
      
      console.log('[MyBookings] Filtered user bookings:', userBookings);
        
        // Expand property details for each booking
        const expandedBookings = await Promise.all(userBookings.map(async (booking: any) => {
          try {
            // Get property details using pyFetch
            const property = await pyFetch(`/api/properties/${booking.property_id}`, { 
              method: 'GET', 
              useApiKey: false 
            });
            
            console.log('[MyBookings] Property data for booking:', booking.id, property);
            
            // Get agent contact info ONLY (not owner)
            let contactInfo = {
              first_name: 'Agent',
              last_name: 'Contact',
              email: 'contact@homeandown.com',
              phone_number: 'N/A'
            };
            
            if (property) {
              // Try to get agent info first
              if (property.assigned_agent_id || property.agent_id) {
                try {
                  const agentId = property.assigned_agent_id || property.agent_id;
                  const agentData = await pyFetch(`/api/users/${agentId}`, { 
                    method: 'GET', 
                    useApiKey: false 
                  });
                  if (agentData) {
                    contactInfo = {
                      first_name: agentData.first_name || 'Agent',
                      last_name: agentData.last_name || 'Contact',
                      email: agentData.email || 'contact@homeandown.com',
                      phone_number: agentData.phone_number || 'N/A'
                    };
                  }
                } catch (err) {
                  console.log('[MyBookings] Could not fetch agent info:', err);
                }
              }
              // NO FALLBACK to owner - only show agent details
              // If no agent assigned, show default contact info
            }
            
            return {
              ...booking,
              properties: property ? {
                ...property,
                users: contactInfo
              } : {
                id: booking.property_id,
                title: 'Property',
                address: 'Address not available',
                city: 'City not available',
                state: 'State not available',
                price: 0,
                monthly_rent: 0,
                listing_type: 'SALE',
                images: [],
                users: contactInfo
              }
            };
          } catch (error) {
            console.error('Error fetching property details:', error);
            return {
              ...booking,
              properties: {
                id: booking.property_id,
                title: 'Property',
                address: 'Address not available',
                city: 'City not available',
                state: 'State not available',
                price: 0,
                monthly_rent: 0,
                listing_type: 'SALE',
                images: [],
                users: {
                  first_name: 'Agent',
                  last_name: 'Contact',
                  email: 'contact@homeandown.com',
                  phone_number: 'N/A'
                }
              }
            };
          }
        }));
        
        console.log('[MyBookings] Expanded bookings:', expandedBookings);
        setBookings(expandedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err); 
      toast.error('Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: Booking['status']) {
    const map: Record<Booking['status'], { color: string; icon: any }> = {
      pending:   { color: 'bg-yellow-100 text-yellow-800', icon: Clock       },
      confirmed: { color: 'bg-green-100 text-green-800',  icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800',      icon: XCircle     },
      completed: { color: 'bg-blue-100 text-blue-800',    icon: CheckCircle },
    };
    const { color, icon: Icon } = map[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status[0].toUpperCase() + status.slice(1)}
      </span>
    );
  }

  async function handleCancelBooking(bookingId: string) {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const response = await fetch(`/api/records/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'cancelled',
          agent_notes: 'Cancelled by user'
        })
      });
      
      if (response.ok) {
        toast.success('Booking cancelled successfully');
        await fetchBookings();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error('Failed to cancel booking');
    }
  }

  function handleViewBooking(b: Booking) {
    setSelectedBooking(b);
    setShowViewModal(true);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-[90px] flex justify-center">
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              navigate('/');
            }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-[90px] pb-16">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-[#061D58] mb-2">My Bookings</h1>
            <p className="text-gray-600">Track your upcoming tours</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all','pending','confirmed','cancelled','completed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === s
                    ? 'bg-[#90C641] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-6">You haven’t made any tours yet.</p>
              <button
                onClick={() => navigate('/buy')}
                className="bg-[#90C641] text-white px-6 py-3 rounded-lg"
              >
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.filter(bk => bk && bk.properties).map(bk => (
                <div key={bk.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-1/4">
                      <img
                        src={bk.properties.images?.[0] || '/placeholder-property.jpg'}
                        alt={bk.properties.title || 'Property'}
                        className="w-full h-48 lg:h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => navigate(buildPropertyUrl(bk.properties.title, bk.properties.id))}
                      />
                    </div>
                    <div className="lg:w-3/4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3
                          className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-[#90C641]"
                          onClick={() => navigate(`/property/${bk.properties.id}`)}
                        >
                          {bk.properties.title}
                        </h3>
                        {getStatusBadge(bk.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Tour Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                              <Calendar className="mr-2 text-[#90C641]" size={16} />
                              <span>
                                {new Date(bk.booking_date).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-2 text-[#90C641]" size={16} />
                              <span>
                                {bk.booking_time
                                  ? new Date(`2000-01-01T${bk.booking_time}`).toLocaleTimeString(undefined, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Time not set'}
                              </span>
                            </div>
                            {bk.notes && (
                              <p className="text-sm text-gray-600 mt-2">
                                <strong>Notes:</strong> {bk.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Agent Contact</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                              <UserIcon className="mr-2 text-[#90C641]" size={16} />
                              <span>
                                {bk.properties?.users?.first_name || 'Agent'}{' '}
                                {bk.properties?.users?.last_name || 'Contact'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="mr-2 text-[#90C641]" size={16} />
                              <span>{bk.properties?.users?.email || 'contact@homeandown.com'}</span>
                            </div>
                            <div className="flex items-center">
                              <Phone className="mr-2 text-[#90C641]" size={16} />
                              <span>{bk.properties?.users?.phone_number || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleViewBooking(bk)}
                          className="bg-[#90C641] text-white px-4 py-2 rounded-full hover:bg-[#7DAF35] transition flex items-center"
                        >
                          <Eye size={16} className="mr-2" />
                          View Details
                        </button>
                        {bk.status === 'pending' && (
                          <button
                            onClick={() => handleCancelBooking(bk.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition flex items-center"
                          >
                            <XCircle size={16} className="mr-2" />
                            Cancel
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Requested on{' '}
                        {new Date(bk.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ViewBookingModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        booking={selectedBooking}
      />
    </div>
  );
};

export default MyBookings;
