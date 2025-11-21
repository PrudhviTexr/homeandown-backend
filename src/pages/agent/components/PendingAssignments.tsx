import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Home, DollarSign, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { AgentApi } from '@/services/pyApi';
import { toast } from 'react-hot-toast';

interface Property {
  id: string;
  title: string;
  property_type: string;
  price?: number;
  monthly_rent?: number;
  address: string;
  city: string;
  state: string;
  images: string[];
}

interface PendingNotification {
  id: string;
  property_id: string;
  agent_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout' | 'expired';
  sent_at: string;
  expires_at: string;
  responded_at?: string;
  property: Property;
}

const PendingAssignments: React.FC = () => {
  const [notifications, setNotifications] = useState<PendingNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchPendingAssignments();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingAssignments, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update countdown timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeRemaining: { [key: string]: number } = {};
      notifications.forEach(notification => {
        const expiresAt = new Date(notification.expires_at).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        newTimeRemaining[notification.id] = remaining;
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [notifications]);

  const fetchPendingAssignments = async () => {
    try {
      setLoading(true);
      console.log('[PendingAssignments] Fetching pending assignments...');
      const response = await AgentApi.getPendingAssignments();
      const notificationsData = response?.notifications || [];
      console.log('[PendingAssignments] Fetched:', notificationsData.length, 'pending assignments');
      setNotifications(notificationsData);
    } catch (error) {
      console.error('[PendingAssignments] Error fetching assignments:', error);
      toast.error('Failed to load pending assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (notificationId: string, propertyTitle: string) => {
    try {
      setActionLoading(notificationId);
      console.log('[PendingAssignments] Accepting assignment:', notificationId);
      
      const response = await AgentApi.acceptAssignment(notificationId);
      
      if (response?.success) {
        toast.success(`Property "${propertyTitle}" assigned to you successfully!`);
        // Remove from list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        toast.error(response?.error || 'Failed to accept assignment');
      }
    } catch (error: any) {
      console.error('[PendingAssignments] Error accepting assignment:', error);
      const errorMessage = error?.message || 'Failed to accept assignment';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
      fetchPendingAssignments(); // Refresh list
    }
  };

  const handleReject = async (notificationId: string, propertyTitle: string) => {
    if (!window.confirm(`Are you sure you want to reject the assignment for "${propertyTitle}"?`)) {
      return;
    }

    try {
      setActionLoading(notificationId);
      console.log('[PendingAssignments] Rejecting assignment:', notificationId);
      
      const response = await AgentApi.rejectAssignment(notificationId);
      
      if (response?.success) {
        toast.success('Assignment rejected. Moving to next agent.');
        // Remove from list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        toast.error(response?.error || 'Failed to reject assignment');
      }
    } catch (error: any) {
      console.error('[PendingAssignments] Error rejecting assignment:', error);
      const errorMessage = error?.message || 'Failed to reject assignment';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
      fetchPendingAssignments(); // Refresh list
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatIndianCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Assignments</h3>
        <p className="text-gray-600">You have no property assignments waiting for your response.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Action Required</h3>
            <p className="text-sm text-blue-800 mt-1">
              You have {notifications.length} pending property assignment{notifications.length > 1 ? 's' : ''}. 
              Please respond within 5 minutes or the assignment will move to the next agent.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {notifications.map((notification) => {
          const property = notification.property;
          const remaining = timeRemaining[notification.id] || 0;
          const isExpired = remaining === 0;
          const isUrgent = remaining < 60; // Less than 1 minute

          return (
            <div 
              key={notification.id} 
              className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${
                isExpired ? 'border-red-400 opacity-75' : 
                isUrgent ? 'border-orange-400' : 
                'border-blue-400'
              }`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Property Image */}
                <div className="md:w-1/3">
                  <img
                    src={property?.images?.[0] || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'}
                    alt={property?.title || 'Property'}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </div>

                {/* Property Details */}
                <div className="md:w-2/3 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {property?.title || 'Property Assignment'}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {property?.address}, {property?.city}, {property?.state}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Home className="h-4 w-4 mr-2" />
                        <span className="text-sm capitalize">
                          {property?.property_type?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center text-green-600 font-bold text-lg mb-2">
                        <DollarSign className="h-5 w-5" />
                        {property?.price 
                          ? formatIndianCurrency(property.price)
                          : property?.monthly_rent 
                            ? `₹${property.monthly_rent.toLocaleString()}/mo`
                            : 'Price on request'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Time Remaining */}
                  <div className={`flex items-center justify-center py-3 px-4 rounded-lg mb-4 ${
                    isExpired ? 'bg-red-100' : 
                    isUrgent ? 'bg-orange-100' : 
                    'bg-blue-100'
                  }`}>
                    <Clock className={`h-5 w-5 mr-2 ${
                      isExpired ? 'text-red-600' : 
                      isUrgent ? 'text-orange-600' : 
                      'text-blue-600'
                    }`} />
                    <span className={`font-bold text-lg ${
                      isExpired ? 'text-red-700' : 
                      isUrgent ? 'text-orange-700' : 
                      'text-blue-700'
                    }`}>
                      {isExpired ? 'EXPIRED' : `Time Remaining: ${formatTimeRemaining(remaining)}`}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {!isExpired && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAccept(notification.id, property?.title || 'property')}
                        disabled={actionLoading === notification.id}
                        className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                      >
                        {actionLoading === notification.id ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Accept Assignment
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(notification.id, property?.title || 'property')}
                        disabled={actionLoading === notification.id}
                        className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                      >
                        {actionLoading === notification.id ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 mr-2" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {isExpired && (
                    <div className="text-center text-red-600 font-semibold py-3">
                      This assignment has expired and will be assigned to the next agent.
                    </div>
                  )}

                  {/* Sent Time */}
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    Sent: {new Date(notification.sent_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingAssignments;

