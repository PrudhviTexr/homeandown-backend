import React from 'react';
import { X, Calendar, Clock, MapPin, User, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { formatIndianCurrency } from '@/utils/currency';

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

interface ViewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

const ViewBookingModal: React.FC<ViewBookingModalProps> = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    };
    
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Property Image */}
            <div className="md:w-1/3">
              <img
                src={booking.properties.images[0]}
                alt={booking.properties.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="mt-4 text-center">
                <span className="text-lg font-bold text-[#90C641]">
                  {booking.properties.listing_type === 'SALE' 
                    ? formatIndianCurrency(booking.properties.price)
                    : `${formatIndianCurrency(booking.properties.monthly_rent)}/month`
                  }
                </span>
              </div>
            </div>

            {/* Booking Details */}
            <div className="md:w-2/3">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {booking.properties.title}
              </h3>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin size={16} className="mr-1" />
                <span className="text-sm">{booking.properties.address}, {booking.properties.city}</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">Booking Status</h4>
                  {getStatusBadge(booking.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-[#90C641]" />
                    <span>{new Date(booking.booking_date).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-[#90C641]" />
                    <span>
                      {booking.booking_time && booking.booking_time.length >= 5 ? 
                        new Date(`2000-01-01T${booking.booking_time.substring(0, 5)}`).toLocaleTimeString('en-US', {
                          hour: '2-digit', 
                          minute: '2-digit'
                        }) 
                      : 'Time not specified'}
                    </span>
                  </div>
                </div>
                
                {booking.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {booking.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Property Owner</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <User size={16} className="mr-2 text-[#90C641]" />
                    <span>{booking.properties.users?.first_name || 'Property'} {booking.properties.users?.last_name || 'Owner'}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2 text-[#90C641]" />
                    <span>{booking.properties.users?.email || 'No email available'}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone size={16} className="mr-2 text-[#90C641]" />
                    <span>{booking.properties.users?.phone_number || 'No phone available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBookingModal;