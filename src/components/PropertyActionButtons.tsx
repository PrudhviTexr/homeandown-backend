import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PropertyActionButtonsProps {
  property: any;
  onInquiry: () => void;
  onBooking: () => void;
  inquiryLoading?: boolean;
}

const PropertyActionButtons: React.FC<PropertyActionButtonsProps> = ({
  property,
  onInquiry,
  onBooking,
  inquiryLoading = false
}) => {
  const { user } = useAuth();

  // Debug logging
  console.log('[PropertyActionButtons] User:', user);
  console.log('[PropertyActionButtons] Property:', property);
  console.log('[PropertyActionButtons] onInquiry:', typeof onInquiry);
  console.log('[PropertyActionButtons] onBooking:', typeof onBooking);

  const handleInquiryClick = () => {
    console.log('[PropertyActionButtons] Inquiry button clicked');
    if (onInquiry) {
      onInquiry();
    } else {
      console.error('[PropertyActionButtons] onInquiry callback is not defined');
    }
  };

  const handleBookingClick = () => {
    console.log('[PropertyActionButtons] Booking button clicked');
    if (onBooking) {
      onBooking();
    } else {
      console.error('[PropertyActionButtons] onBooking callback is not defined');
    }
  };

  // Don't show inquiry/booking buttons for agents
  if (user && (user as any).user_type === 'agent') {
    return (
      <div className="mt-6 space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Agent View
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>As an agent, you can manage this property from your dashboard.</p>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => window.location.href = '/agent/dashboard'}
          className="w-full bg-[#90C641] text-white py-3 rounded-full hover:bg-[#7DAF35] transition-all duration-200 font-semibold text-sm md:text-base shadow-md hover:shadow-lg flex items-center justify-center"
        >
          Go to Agent Dashboard
        </button>
      </div>
    );
  }

  // Show normal inquiry/booking buttons for regular users
  return (
    <div className="mt-6 space-y-3">
      {user ? (
        <>
          <button
            onClick={handleInquiryClick}
            disabled={inquiryLoading}
            className="w-full bg-[#90C641] text-white py-3 rounded-full hover:bg-[#7DAF35] transition-all duration-200 font-semibold text-sm md:text-base disabled:opacity-50 shadow-md hover:shadow-lg flex items-center justify-center"
          >
            {inquiryLoading && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />}
            {inquiryLoading ? 'Sending...' : 'Send Enquiry'}
          </button>
          <button
            onClick={handleBookingClick}
            className="w-full bg-[#162e5a] text-white py-3 rounded-full hover:bg-[#0f2340] transition-all duration-200 font-semibold text-sm md:text-base shadow-md hover:shadow-lg flex items-center justify-center"
          >
            Schedule Tour
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleInquiryClick}
            disabled={inquiryLoading}
            className="w-full bg-[#90C641] text-white py-3 rounded-full hover:bg-[#7DAF35] transition-all duration-200 font-semibold text-sm md:text-base disabled:opacity-50 shadow-md hover:shadow-lg flex items-center justify-center"
          >
            {inquiryLoading && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />}
            {inquiryLoading ? 'Sending...' : 'Send Enquiry'}
          </button>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Sign in to schedule tours
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Create an account to book property tours and get personalized recommendations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyActionButtons;
