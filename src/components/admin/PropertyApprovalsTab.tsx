import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, Clock, MapPin, DollarSign, UserCheck, AlertTriangle, Edit } from 'lucide-react';
import PropertyApprovalModal from './PropertyApprovalModal';
import toast from 'react-hot-toast';
import { AdminApi } from '@/services/pyApi';

interface PendingProperty {
  id: string;
  title: string;
  description: string;
  price: number | null;
  monthly_rent: number | null;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  address: string;
  city: string;
  state: string;
  status: string;
  verified: boolean;
  created_at: string;
  owner_id: string | null;
  owner_name?: string;
  added_by: string | null;
  images: string[];
}

const PropertyApprovalsTab: React.FC = () => {
  const [pendingProperties, setPendingProperties] = useState<PendingProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PendingProperty | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingProperties();
  }, []);

  const fetchPendingProperties = async () => {
    try {
      setLoading(true);
      // Fetch properties via Python Admin API and filter for unverified properties
      const properties = (await AdminApi.properties()) as any[];
      const filtered = (properties || [])
        .filter(p => !p.verified) // Only show unverified properties
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPendingProperties(filtered);
    } catch (error) {
      console.error('Error fetching pending properties:', error);
      toast.error('Failed to load pending properties');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProperty = (property: PendingProperty) => {
    alert(`Attempting to view property: ${property.title}`); // DEBUGGING ALERT
    console.log("handleViewProperty called with:", property);
    if (!property) {
      console.error("handleViewProperty: received null or undefined property");
      toast.error("Cannot view details of an invalid property.");
      return;
    }
    setSelectedProperty(property);
    setShowApprovalModal(true);
    console.log("showApprovalModal should be true now.");
  };

  const handleEditProperty = (property: PendingProperty) => {
    alert(`Attempting to edit property: ${property.title}`); // DEBUGGING ALERT
    console.log("Navigating to edit property:", property.id);
    navigate(`/edit-property/${property.id}`);
  };

  const handleApprovalChange = async (propertyId: string, approved: boolean, reason?: string, status?: string) => {
    try {
      if (approved) {
        await AdminApi.approveProperty(propertyId);
        toast.success('Property approved successfully');
      } else if (status === 'resubmit') {
        await AdminApi.resubmitProperty(propertyId, reason || 'Please resubmit with corrections');
        toast.success('Property sent back for resubmission');
      } else {
        await AdminApi.rejectProperty(propertyId, reason || 'Rejected by admin');
        toast.success('Property rejected');
      }
      
      // Refresh the list
      await fetchPendingProperties();
    } catch (error) {
      console.error('Error updating property approval:', error);
      toast.error('Failed to update property approval');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'resubmit':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'resubmit':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Approvals</h2>
          <p className="text-gray-600 mt-1">
            Review and approve property listings before they appear on the website
          </p>
        </div>
        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
          {pendingProperties.length} Pending
        </div>
      </div>

      {/* Pending Properties List */}
      {pendingProperties.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Properties</h3>
          <p className="text-gray-600">All property listings have been reviewed and approved.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {pendingProperties.map((property) => (
              <li key={property.id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Property Image */}
                      <div className="flex-shrink-0">
                        {property.images && property.images.length > 0 ? (
                          <img
                            className="w-16 h-16 rounded-lg object-cover"
                            src={property.images[0]}
                            alt={property.title}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {property.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                            {property.status}
                          </span>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(property.status)}
                            <span className="text-xs text-gray-500 capitalize">
                              {property.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.city}, {property.state}
                            {property.zip_code && (
                              <span className="ml-1">• {property.zip_code}</span>
                            )}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatPrice(property.price, property.monthly_rent)}
                          </span>
                          {property.bedrooms && (
                            <span>{property.bedrooms} BHK</span>
                          )}
                          {property.area_sqft && (
                            <span>{property.area_sqft} sq ft</span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate">
                          {property.description || 'No description provided'}
                        </p>
                        
                        <div className="flex items-center mt-2 text-xs text-gray-500 space-x-4">
                          <span>Type: {property.property_type}</span>
                          <span>Listed: {new Date(property.created_at).toLocaleDateString()}</span>
                          {property.owner_name && <span>Owner: {property.owner_name}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewProperty(property)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </button>
                      <button
                        onClick={() => handleEditProperty(property)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Approval Modal */}
      <PropertyApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedProperty(null);
        }}
        property={selectedProperty}
        onApprovalChange={handleApprovalChange}
      />
    </div>
  );
};

export default PropertyApprovalsTab;
