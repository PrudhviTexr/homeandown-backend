import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  MapPin, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pyFetch } from '@/utils/backend';

interface PropertyAssignment {
  id: string;
  property_id: string;
  title: string;
  property_type: string;
  listing_type: string;
  price?: number;
  monthly_rent?: number;
  city: string;
  state: string;
  zip_code: string;
  area_sqft: number;
  images?: string[];
  created_at: string;
  notification_round: number;
  status: 'pending' | 'accepted' | 'rejected';
}

const PropertyAssignmentPanel: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<PropertyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPropertyAssignments();
    }
  }, [user]);

  const fetchPropertyAssignments = async () => {
    try {
      setLoading(true);
      
      // Get notifications for property assignments
      const notifications = await pyFetch('/api/admin/notifications', {
        method: 'GET',
        useApiKey: true
      });

      // Filter for property assignment notifications for this agent
      const propertyNotifications = notifications.filter((n: any) => 
        n.type === 'property_assignment' && 
        n.user_id === user?.id &&
        !n.read &&
        !n.cancelled
      );

      // Get property details for each notification
      const assignmentsWithDetails = await Promise.all(
        propertyNotifications.map(async (notification: any) => {
          try {
            const property = await pyFetch(`/api/properties/${notification.entity_id}`, {
              method: 'GET',
              useApiKey: false
            });
            
            return {
              id: notification.id,
              property_id: notification.entity_id,
              title: property.title || 'Untitled Property',
              property_type: property.property_type,
              listing_type: property.listing_type,
              price: property.price,
              monthly_rent: property.monthly_rent,
              city: property.city,
              state: property.state,
              zip_code: property.zip_code,
              area_sqft: property.area_sqft,
              images: property.images,
              created_at: notification.created_at,
              notification_round: property.notification_round || 1,
              status: 'pending'
            };
          } catch (error) {
            console.error('Error fetching property details:', error);
            return null;
          }
        })
      );

      setAssignments(assignmentsWithDetails.filter(Boolean));
    } catch (error) {
      console.error('Error fetching property assignments:', error);
      toast.error('Failed to load property assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAssignment = async (propertyId: string) => {
    setActionLoading(propertyId);
    
    try {
      await pyFetch(`/api/admin/properties/${propertyId}/accept`, {
        method: 'POST',
        useApiKey: true,
        body: JSON.stringify({ agent_id: user?.id })
      });

      toast.success('Property assignment accepted successfully!');
      fetchPropertyAssignments();
    } catch (error) {
      console.error('Error accepting assignment:', error);
      toast.error('Failed to accept property assignment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAssignment = async (propertyId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):') || '';
    
    setActionLoading(propertyId);
    
    try {
      await pyFetch(`/api/admin/properties/${propertyId}/reject`, {
        method: 'POST',
        useApiKey: true,
        body: JSON.stringify({ 
          agent_id: user?.id,
          reason 
        })
      });

      toast.success('Property assignment rejected');
      fetchPropertyAssignments();
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      toast.error('Failed to reject property assignment');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price?: number, listingType?: string) => {
    if (!price) return 'Price on request';
    
    const formattedPrice = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
    
    return listingType === 'RENT' ? `${formattedPrice}/month` : formattedPrice;
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Home className="w-5 h-5 text-blue-600" />
          Property Assignments
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {assignments.length} pending assignment{assignments.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-6">
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Property Assignments</h3>
            <p className="text-gray-600">You don't have any pending property assignments at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{assignment.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {assignment.city}, {assignment.state} - {assignment.zip_code}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatPrice(assignment.price || assignment.monthly_rent, assignment.listing_type)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        {assignment.area_sqft} sq ft
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Round {assignment.notification_round}
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      {getPropertyTypeDisplay(assignment.property_type)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    Assigned: {formatDate(assignment.created_at)}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(`/property/${assignment.property_id}`, '_blank')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    
                    <button
                      onClick={() => handleRejectAssignment(assignment.property_id)}
                      disabled={actionLoading === assignment.property_id}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      {actionLoading === assignment.property_id ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Reject
                    </button>
                    
                    <button
                      onClick={() => handleAcceptAssignment(assignment.property_id)}
                      disabled={actionLoading === assignment.property_id}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      {actionLoading === assignment.property_id ? (
                        <div className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyAssignmentPanel;
