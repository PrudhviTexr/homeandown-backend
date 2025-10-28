import React from 'react';
import { X, MapPin, User, Mail, Phone, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { formatIndianCurrency } from '@/utils/currency';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'new' | 'responded' | 'closed';
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

interface ViewInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry: Inquiry | null;
}

const ViewInquiryModal: React.FC<ViewInquiryModalProps> = ({ isOpen, onClose, inquiry }) => {
  if (!isOpen || !inquiry) return null;

  const getStatusBadge = (status: string) => {
    const badges = {
      new: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      responded: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
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
            <h2 className="text-xl font-bold text-gray-900">Inquiry Details</h2>
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
                src={inquiry.properties.images[0]}
                alt={inquiry.properties.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="mt-4 text-center">
                <span className="text-lg font-bold text-[#90C641]">
                  {inquiry.properties.listing_type === 'SALE' 
                    ? formatIndianCurrency(inquiry.properties.price)
                    : `${formatIndianCurrency(inquiry.properties.monthly_rent)}/month`
                  }
                </span>
              </div>
            </div>

            {/* Inquiry Details */}
            <div className="md:w-2/3">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {inquiry.properties.title}
              </h3>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin size={16} className="mr-1" />
                <span className="text-sm">{inquiry.properties.address}, {inquiry.properties.city}</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">Inquiry Status</h4>
                  {getStatusBadge(inquiry.status)}
                </div>
                
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-[#90C641]" />
                  <span>{new Date(inquiry.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Property Owner</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <User size={16} className="mr-2 text-[#90C641]" />
                    <span>{inquiry.properties.users?.first_name || 'Property'} {inquiry.properties.users?.last_name || 'Owner'}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2 text-[#90C641]" />
                    <span>{inquiry.properties.users?.email || 'No email available'}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone size={16} className="mr-2 text-[#90C641]" />
                    <span>{inquiry.properties.users?.phone_number || 'No phone available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">Your Message</h4>
            <div className="bg-white p-4 rounded border border-gray-200">
              <p className="text-gray-700 whitespace-pre-line">{inquiry.message}</p>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Sent on {new Date(inquiry.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
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

export default ViewInquiryModal;