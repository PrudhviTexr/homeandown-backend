import React from 'react';
import { X, Calendar, Clock, Home, User, Info, Mail, Phone, MapPin } from 'lucide-react';
import { Booking } from '@/types/database';

interface ViewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

const ViewBookingModal: React.FC<ViewBookingModalProps> = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          icon: <Info className="w-5 h-5 text-green-500" />,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
        };
      case 'cancelled':
        return {
          icon: <X className="w-5 h-5 text-red-500" />,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
        };
      case 'pending':
      default:
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
        };
    }
  };

  const statusInfo = getStatusInfo(booking.status || 'pending');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
              {statusInfo.icon}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Booking #{booking.custom_id || booking.id.substring(0, 8)}
              </p>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span className={`font-medium capitalize ${statusInfo.color}`}>{booking.status}</span>
                <span>•</span>
                <span>Created on {new Date(booking.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-700 border-b pb-2">Booking Information</h3>
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(booking.booking_date)}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{booking.booking_time}</p>
                </div>
              </div>
              {booking.notes && (
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium text-gray-800">{booking.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Property Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-700 border-b pb-2">Property Information</h3>
              <div className="flex items-start">
                <Home className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Property</p>
                  <p className="font-medium">{booking.property_title || 'Unknown Property'}</p>
                  <p className="text-xs text-gray-400">ID: {booking.property_id || 'N/A'}</p>
                </div>
              </div>
              {/* Add more property details here if available, e.g., address */}
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4 md:col-span-2">
              <h3 className="font-semibold text-gray-700 border-b pb-2">Customer Information</h3>
              <div className="flex items-start">
                <User className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{booking.customer_name || 'Not available'}</p>
                  <p className="text-xs text-gray-400">ID: {booking.user_id || 'N/A'}</p>
                </div>
              </div>
               {/* Add more customer details here, e.g., email, phone */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBookingModal;