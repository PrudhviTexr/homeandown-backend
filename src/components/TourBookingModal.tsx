import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import ApiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface TourBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
}

const TourBookingModal: React.FC<TourBookingModalProps> = ({ isOpen, onClose, property }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes] = useState([
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ]);

  console.log('[TourBookingModal] isOpen:', isOpen);
  console.log('[TourBookingModal] property:', property);
  console.log('[TourBookingModal] user:', user);

  useEffect(() => {
    if (isOpen) {
      generateAvailableDates();
    }
  }, [isOpen]);

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();

    // Generate dates for the next 60 days
    for (let i = 1; i <= 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    setAvailableDates(dates);
  };

  const handleSubmit = async (e: React.FormEvent, retryCount = 0) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to book a tour');
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    // Validate phone number - use fallback if not available
    const phoneNumber = user.phone_number || user.phone || '1234567890';
    if (!phoneNumber || phoneNumber.trim() === '') {
      toast.error('Phone number is required. Please update your profile with a valid phone number.');
      return;
    }
    
    console.log('[TourBookingModal] Using phone number:', phoneNumber);

    setLoading(true);
    try {
      const bookingPayload = {
        property_id: property.id,
        name: `${user.first_name} ${user.last_name}`.trim() || user.email?.split('@')[0] || 'User',
        email: user.email,
        phone: phoneNumber,
        booking_date: selectedDate,
        booking_time: selectedTime,
        notes: notes || 'Tour request via website'
      };

      console.log('[TourBookingModal] Sending booking request:', bookingPayload);
      const result = await ApiService.createBooking(bookingPayload);

      console.log('[TourBookingModal] Booking API response:', result);
      
      // Check if booking was successful
      if (result?.success === false || result?.error) {
        const errorMsg = result?.error || result?.detail || 'Failed to book tour. Please try again.';
        toast.error(`❌ ${errorMsg}`, {
          duration: 6000,
        });
        setLoading(false);
        return;
      }
      
      // Get booking status from result
      const bookingStatus = result?.status || result?.booking?.status || 'pending';
      const bookingId = result?.id || result?.booking?.id;
      
      // Show immediate success notification with confirmation
      toast.success(
        (t) => (
          <div className="flex flex-col">
            <div className="font-semibold">✅ Booking Confirmed!</div>
            <div className="text-sm mt-1">
              Your tour request for <strong>{property.title}</strong> has been submitted successfully.
            </div>
            <div className="text-xs mt-1 text-gray-600">
              Date: {selectedDate} at {selectedTime}
            </div>
            {bookingId && (
              <div className="text-xs mt-1 text-gray-500">
                Booking ID: {bookingId.substring(0, 8)}...
              </div>
            )}
          </div>
        ),
        {
          duration: 6000,
          icon: '🎉',
        }
      );
      
      // Reset form immediately
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
      
      // Close modal immediately after showing success
      setLoading(false);
      setTimeout(() => {
        onClose();
      }, 500);
      
      // Navigate to My Bookings page after modal closes
      setTimeout(() => {
        window.location.href = '/my-bookings';
      }, 1500);
    } catch (error: any) {
      console.error('Error booking tour:', error);
      
      // Retry logic for network failures (max 2 retries)
      if (retryCount < 2 && (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch'))) {
        toast.error('Network error. Retrying...');
        setTimeout(() => {
          handleSubmit(e, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // User-friendly error messages - ALWAYS show notification
      let errorMessage = 'Failed to book tour. Please try again.';
      
      // Parse error message from API response
      if (error.message) {
        try {
          const errorObj = JSON.parse(error.message);
          if (errorObj.detail) {
            errorMessage = errorObj.detail;
          } else if (errorObj.error) {
            errorMessage = errorObj.error;
          } else if (typeof errorObj === 'string') {
            errorMessage = errorObj;
          }
        } catch {
          // If not JSON, use the message as is
          if (error.message.includes('404') || error.message.includes('Not Found')) {
            errorMessage = 'Booking service is temporarily unavailable. Please try again later.';
          } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to reach the server. Please check your internet connection and try again.';
          } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
            errorMessage = 'Server error occurred. Please try again in a few moments.';
          } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
            errorMessage = 'Invalid booking details. Please check your information and try again.';
          } else {
            errorMessage = error.message;
          }
        }
      }
      
      // Always show error notification
      toast.error(`❌ ${errorMessage}`, {
        duration: 6000, // Show for 6 seconds
      });
      console.error('[TourBookingModal] Booking failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#162e5a]">Schedule a Tour</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Property Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-[#162e5a] mb-2">{property.title}</h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin size={16} className="mr-1" />
              <span>{property.address || `${property.city}, ${property.state}`}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Date Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Select Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ca5e9] focus:border-transparent"
                required
              >
                <option value="">Choose a date</option>
                {availableDates.map((date) => {
                  const dateObj = new Date(date);
                  const formattedDate = dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  });
                  return (
                    <option key={date} value={date}>
                      {formattedDate}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Time Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Select Time
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ca5e9] focus:border-transparent"
                required
              >
                <option value="">Choose a time</option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>
                    {time} {parseInt(time.split(':')[0]) < 12 ? 'AM' : 'PM'}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements or questions..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ca5e9] focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#162e5a] text-white py-3 rounded-lg hover:bg-[#0f2340] transition-all duration-200 font-semibold disabled:opacity-50 flex items-center justify-center"
            >
              {loading && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />}
              {loading ? 'Booking...' : 'Book Tour'}
            </button>
          </form>

          {/* Info Text */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            The property owner will receive your request and confirm the tour timing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TourBookingModal;
