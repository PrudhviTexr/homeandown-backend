import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Eye, 
  MessageSquare, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Users,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { pyFetch } from '@/utils/backend';
import SellerHeader from '@/components/seller/SellerHeader';

interface Property {
  id: string;
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  price?: number;
  monthly_rent?: number;
  city: string;
  state: string;
  address: string;
  status: string;
  images?: string[];
  inquiries_count: number;
  bookings_count: number;
  views_count: number;
  assigned_agent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    assigned_at?: string;
  };
}

interface PropertyView {
  id: string;
  viewer_name: string;
  viewed_at: string;
}

interface Inquiry {
  id: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  message: string;
  created_at: string;
  status: string;
}

const SellerPropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [views, setViews] = useState<PropertyView[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchPropertyDetails = useCallback(async () => {
    if (fetchingRef.current || !id) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      // Fetch property details
      const propertyData = await pyFetch(`/api/seller/properties/${id}`, {
        useApiKey: false
      });
      
      if (propertyData?.property) {
        setProperty(propertyData.property);
      }

      // Fetch property views (name and date only)
      try {
        const viewsData = await pyFetch(`/api/seller/properties/${id}/views`, {
          useApiKey: false
        });
        if (viewsData?.views) {
          setViews(viewsData.views);
        }
      } catch (error) {
        console.error('Error fetching views:', error);
        setViews([]);
      }

      // Fetch inquiries for this property
      try {
        const inquiriesData = await pyFetch(`/api/seller/inquiries?property_id=${id}`, {
          useApiKey: false
        });
        if (inquiriesData?.inquiries) {
          setInquiries(inquiriesData.inquiries);
        }
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        setInquiries([]);
      }

    } catch (error) {
      console.error('Error fetching property details:', error);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [id]);

  useEffect(() => {
    if (id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPropertyDetails();
    }
  }, [id, fetchPropertyDetails]);

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
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

  const getPropertyTypeDisplay = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Property not found</p>
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SellerHeader
        title={property.title}
        subtitle={`${property.city}, ${property.state}`}
        showAddProperty={true}
        showBackButton={true}
        backUrl="/seller/dashboard"
        rightAction={
          <button
            onClick={() => navigate(`/edit-property/${property.id}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Edit Property
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-96 bg-gray-200 flex items-center justify-center">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-24 h-24 text-gray-400" />
                )}
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900 mt-1">{property.description || 'No description provided'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Property Type</p>
                    <p className="text-gray-900 font-medium">{getPropertyTypeDisplay(property.property_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Listing Type</p>
                    <p className="text-gray-900 font-medium">{property.listing_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-gray-900 font-medium">
                      {property.listing_type === 'RENT' 
                        ? formatPrice(property.monthly_rent) + '/month'
                        : formatPrice(property.price)
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      property.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {property.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {property.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Interested Members */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Interested Members</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {inquiries.length} {inquiries.length === 1 ? 'Inquiry' : 'Inquiries'}
                </span>
              </div>
              {inquiries.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No inquiries yet</p>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {inquiry.user.first_name} {inquiry.user.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{formatDate(inquiry.created_at)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inquiry.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {inquiry.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-2">{inquiry.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-600">Total Views</span>
                  </div>
                  <span className="font-bold text-gray-900">{property.views_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <span className="text-gray-600">Inquiries</span>
                  </div>
                  <span className="font-bold text-gray-900">{property.inquiries_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-600">Bookings</span>
                  </div>
                  <span className="font-bold text-gray-900">{property.bookings_count}</span>
                </div>
              </div>
            </div>

            {/* Assigned Agent */}
            {property.assigned_agent ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Agent</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{property.assigned_agent.name}</p>
                      <p className="text-sm text-gray-600">Real Estate Agent</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{property.assigned_agent.email}</span>
                    </div>
                    {property.assigned_agent.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{property.assigned_agent.phone}</span>
                      </div>
                    )}
                    {property.assigned_agent.assigned_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">
                          Assigned: {formatDate(property.assigned_agent.assigned_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-yellow-800 text-sm">
                  No agent assigned yet. An agent will be assigned soon.
                </p>
              </div>
            )}

            {/* Property Views */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Views</h3>
              {views.length === 0 ? (
                <p className="text-gray-600 text-center py-4 text-sm">No views recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {views.slice(0, 10).map((view) => (
                    <div key={view.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{view.viewer_name || 'Anonymous'}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(view.viewed_at)}</span>
                    </div>
                  ))}
                  {views.length > 10 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      Showing 10 of {views.length} views
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPropertyDetails;

