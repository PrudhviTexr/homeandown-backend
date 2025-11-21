import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { pyFetch } from '@/utils/backend';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const AgentAssignmentAccept: React.FC = () => {
  const { notificationId } = useParams<{ notificationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    if (notificationId && user) {
      fetchNotificationDetails();
    }
  }, [notificationId, user]);

  const fetchNotificationDetails = async () => {
    try {
      setLoading(true);
      const data = await pyFetch(`/api/agent/property-assignments/${notificationId}`, {
        useApiKey: false
      });
      setNotification(data.notification);
      setProperty(data.property);
    } catch (error: any) {
      console.error('Error fetching notification:', error);
      toast.error(error.message || 'Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!notificationId || !user) return;
    
    try {
      setProcessing(true);
      const result = await pyFetch(`/api/agent/property-assignments/${notificationId}/accept`, {
        method: 'POST',
        useApiKey: false
      });
      
      if (result.success) {
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Assignment Accepted!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    You have been assigned the property: <strong>{property?.title || 'Unknown Property'}</strong>.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate('/agent/dashboard');
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ), { duration: 6000 });

        setTimeout(() => {
          navigate('/agent/dashboard');
        }, 6000);
      } else {
        toast.error(result.error || 'Failed to accept assignment');
      }
    } catch (error: any) {
      console.error('Error accepting assignment:', error);
      toast.error(error.message || 'Failed to accept assignment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!notificationId || !user) return;
    
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    try {
      setProcessing(true);
      const result = await pyFetch(`/api/agent/property-assignments/${notificationId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'No reason provided' }),
        useApiKey: false
      });
      
      if (result.success) {
        toast.success('Assignment rejected. System will notify the next agent.');
        setTimeout(() => {
          navigate('/agent/dashboard');
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to reject assignment');
      }
    } catch (error: any) {
      console.error('Error rejecting assignment:', error);
      toast.error(error.message || 'Failed to reject assignment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!notification || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Assignment Not Found</h2>
          <p className="text-gray-600 mb-4">The assignment you're looking for doesn't exist or has expired.</p>
          <button
            onClick={() => navigate('/agent/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isExpired = notification.expires_at && new Date(notification.expires_at) < new Date();
  const status = notification.status;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`p-6 ${isExpired || status !== 'pending' ? 'bg-gray-100' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
            <h1 className={`text-2xl font-bold ${isExpired || status !== 'pending' ? 'text-gray-900' : 'text-white'}`}>
              Property Assignment - Round {notification.notification_round}
            </h1>
            {isExpired && (
              <p className="text-red-600 mt-2 font-medium">⚠️ This assignment has expired</p>
            )}
            {status === 'accepted' && (
              <p className="text-green-600 mt-2 font-medium">✅ You have already accepted this assignment</p>
            )}
            {status === 'rejected' && (
              <p className="text-red-600 mt-2 font-medium">❌ You have already rejected this assignment</p>
            )}
          </div>

          {/* Property Details */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{property.title}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Property Type</p>
                  <p className="font-semibold">{property.property_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Listing Type</p>
                  <p className="font-semibold">{property.listing_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{property.city}, {property.state}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Zipcode</p>
                  <p className="font-semibold">{property.zip_code}</p>
                </div>
                {property.price && (
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-semibold text-blue-600">₹{property.price.toLocaleString('en-IN')}</p>
                  </div>
                )}
                {property.monthly_rent && (
                  <div>
                    <p className="text-sm text-gray-600">Monthly Rent</p>
                    <p className="font-semibold text-blue-600">₹{property.monthly_rent.toLocaleString('en-IN')}/month</p>
                  </div>
                )}
              </div>

              {property.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-700">{property.description}</p>
                </div>
              )}

              {property.images && property.images.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Property Images</p>
                  <div className="grid grid-cols-3 gap-2">
                    {property.images.slice(0, 3).map((img: string, idx: number) => (
                      <img key={idx} src={img} alt={`Property ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Assignment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sent At:</span>
                  <span>{new Date(notification.sent_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires At:</span>
                  <span>{new Date(notification.expires_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold ${
                    status === 'accepted' ? 'text-green-600' :
                    status === 'rejected' ? 'text-red-600' :
                    status === 'timeout' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>{status.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {status === 'pending' && !isExpired && (
              <div className="flex gap-4">
                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Accept Assignment
                    </>
                  )}
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Reject
                    </>
                  )}
                </button>
              </div>
            )}

            {(status !== 'pending' || isExpired) && (
              <button
                onClick={() => navigate('/agent/dashboard')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentAssignmentAccept;

