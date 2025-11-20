import React, { useState } from 'react';
import { X, CheckCircle, XCircle, MapPin, DollarSign, Calendar, User, Home } from 'lucide-react';

interface PropertyApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onApprovalChange: (propertyId: string, approved: boolean, reason?: string, status?: string) => void;
  isReadOnly?: boolean;
}

const PropertyApprovalModal: React.FC<PropertyApprovalModalProps> = ({
  isOpen,
  onClose,
  property,
  onApprovalChange,
  isReadOnly = false,
}) => {
  const [approvalStatus, setApprovalStatus] = useState('verified');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !property) return null;

  const handleStatusChange = async () => {
    setIsProcessing(true);
    try {
      if (approvalStatus === 'verified') {
        await onApprovalChange(property.id, true, rejectionReason);
      } else {
        await onApprovalChange(property.id, false, rejectionReason);
      }
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number | null, monthlyRent: number | null) => {
    if (price && price > 0) {
      return `₹${price.toLocaleString()}`;
    }
    if (monthlyRent && monthlyRent > 0) {
      return `₹${monthlyRent.toLocaleString()}/month`;
    }
    return 'Price on request';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Property Approval Review</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Property Info */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">{property.title}</h4>
              <p className="text-gray-600">{property.description || 'No description provided'}</p>
            </div>

            {/* Property Images */}
            {property.images && property.images.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Images</h5>
                <div className="grid grid-cols-2 gap-2">
                  {property.images.slice(0, 4).map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Property Details */}
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span>{property.address}, {property.city}, {property.state}</span>
                {property.zip_code && (
                  <span className="ml-2">• {property.zip_code}</span>
                )}
              </div>
              
              <div className="flex items-center text-sm">
                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                <span>{formatPrice(property.price, property.monthly_rent)}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Home className="h-4 w-4 mr-2 text-gray-400" />
                <span>{property.property_type}</span>
                {property.bedrooms && (
                  <span className="ml-2">• {property.bedrooms} BHK</span>
                )}
                {property.area_sqft && (
                  <span className="ml-2">• {property.area_sqft} sq ft</span>
                )}
              </div>
              
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span>Listed: {new Date(property.created_at).toLocaleDateString()}</span>
              </div>
              {property.owner_name && (
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Owner: {property.owner_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Additional Details */}
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Property Specifications</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {property.bedrooms && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bedrooms:</span>
                    <span className="font-medium">{property.bedrooms}</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bathrooms:</span>
                    <span className="font-medium">{property.bathrooms}</span>
                  </div>
                )}
                {property.furnishing_status && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Furnishing:</span>
                    <span className="font-medium">{property.furnishing_status}</span>
                  </div>
                )}
                {property.listing_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listing Type:</span>
                    <span className="font-medium">{property.listing_type}</span>
                  </div>
                )}
                {property.zip_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pincode:</span>
                    <span className="font-medium">{property.zip_code}</span>
                  </div>
                )}
                {property.area_sqft && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Area:</span>
                    <span className="font-medium">{property.area_sqft} sq ft</span>
                  </div>
                )}
                {property.security_deposit && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit:</span>
                    <span className="font-medium">₹{property.security_deposit.toLocaleString()}</span>
                  </div>
                )}
                {property.maintenance_charges && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maintenance:</span>
                    <span className="font-medium">₹{property.maintenance_charges.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Amenities</h5>
                <div className="flex flex-wrap gap-1">
                  {property.amenities.map((amenity: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Approval Actions */}
        <div className="border-t pt-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Status
              </label>
              <select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="resubmit">Needs Resubmission</option>
              </select>
            </div>

            {/* Rejection/Resubmit Reason */}
            {(approvalStatus === 'rejected' || approvalStatus === 'resubmit') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Required for rejection or resubmission)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Please provide a clear reason..."
                />
              </div>
            )}

            {/* Action Buttons */}
            {!isReadOnly && (
              <div className="mt-8 flex flex-col sm:flex-row-reverse gap-4">
                <button
                  onClick={handleStatusChange}
                  disabled={isProcessing || ((approvalStatus === 'rejected' || approvalStatus === 'resubmit') && !rejectionReason.trim())}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Submitting...' : 'Submit Status'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyApprovalModal;
