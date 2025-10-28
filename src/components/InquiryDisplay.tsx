import React from 'react';
import { MapPin, Calendar, User, Mail, Phone, MessageCircle, Eye, Clock } from 'lucide-react';
import { formatIndianCurrency } from '@/utils/currency';

interface InquiryDisplayProps {
  inquiry: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    created_at: string;
    status: string;
    properties?: {
      id: string;
      title: string;
      price?: number;
      monthly_rent?: number;
      listing_type: string;
      property_type: string;
      city: string;
      state: string;
      address: string;
      bedrooms?: number;
      bathrooms?: number;
      area?: number;
      images?: string[];
    };
  };
  showActions?: boolean;
  onViewProperty?: (propertyId: string) => void;
  onContactClient?: (inquiry: any) => void;
  onUpdateStatus?: (inquiryId: string, status: string) => void;
}

const InquiryDisplay: React.FC<InquiryDisplayProps> = ({
  inquiry,
  showActions = true,
  onViewProperty,
  onContactClient,
  onUpdateStatus
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'interested':
        return 'bg-green-100 text-green-800';
      case 'not_interested':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return '🆕';
      case 'contacted':
        return '📞';
      case 'interested':
        return '✅';
      case 'not_interested':
        return '❌';
      case 'closed':
        return '🔒';
      default:
        return '📋';
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

  const getPropertyTypeDisplay = (propertyType: string) => {
    const typeMap: { [key: string]: string } = {
      'independent_house': 'Independent House',
      'standalone_apartment': 'Standalone Apartment',
      'gated_apartment': 'Gated Apartment',
      'villa': 'Villa',
      'commercial': 'Commercial',
      'lands_farmhouse': 'Land/Farmhouse'
    };
    return typeMap[propertyType] || propertyType;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Inquiry #{inquiry.id.slice(-8)}
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(inquiry.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
              <span className="mr-1">{getStatusIcon(inquiry.status)}</span>
              {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Client Information */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-600" />
            Client Information
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm text-gray-900">{inquiry.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-900 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {inquiry.email}
                </p>
              </div>
              {inquiry.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-sm text-gray-900 flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {inquiry.phone}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">Inquiry Date</p>
                <p className="text-sm text-gray-900 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(inquiry.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Property Information */}
        {inquiry.properties && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-600" />
              Property Details
            </h4>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="text-lg font-semibold text-gray-900 mb-1">
                    {inquiry.properties.title}
                  </h5>
                  <p className="text-sm text-gray-600 mb-2">
                    {getPropertyTypeDisplay(inquiry.properties.property_type)}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {inquiry.properties.address}, {inquiry.properties.city}, {inquiry.properties.state}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {inquiry.properties.listing_type === 'RENT' 
                      ? formatIndianCurrency(inquiry.properties.monthly_rent) + '/month'
                      : formatIndianCurrency(inquiry.properties.price)
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {inquiry.properties.listing_type === 'RENT' ? 'Rent' : 'Sale'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {inquiry.properties.bedrooms && (
                  <div>
                    <p className="text-gray-600">Bedrooms</p>
                    <p className="font-medium text-gray-900">{inquiry.properties.bedrooms}</p>
                  </div>
                )}
                {inquiry.properties.bathrooms && (
                  <div>
                    <p className="text-gray-600">Bathrooms</p>
                    <p className="font-medium text-gray-900">{inquiry.properties.bathrooms}</p>
                  </div>
                )}
                {inquiry.properties.area && (
                  <div>
                    <p className="text-gray-600">Area</p>
                    <p className="font-medium text-gray-900">{inquiry.properties.area} sq ft</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Property ID</p>
                  <p className="font-medium text-gray-900">#{inquiry.properties.id.slice(-8)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            <MessageCircle className="h-4 w-4 mr-2 text-gray-600" />
            Inquiry Message
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {inquiry.message || 'No message provided'}
            </p>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-3">
            {inquiry.properties && onViewProperty && (
              <button
                onClick={() => onViewProperty(inquiry.properties.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Property
              </button>
            )}
            
            {onContactClient && (
              <button
                onClick={() => onContactClient(inquiry)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Client
              </button>
            )}

            {onUpdateStatus && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onUpdateStatus(inquiry.id, 'contacted')}
                  className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  Mark Contacted
                </button>
                <button
                  onClick={() => onUpdateStatus(inquiry.id, 'interested')}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Mark Interested
                </button>
                <button
                  onClick={() => onUpdateStatus(inquiry.id, 'closed')}
                  className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Close Inquiry
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryDisplay;
