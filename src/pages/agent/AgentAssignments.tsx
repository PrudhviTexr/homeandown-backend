import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, MapPin, Phone, Mail, User, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 
import { AdminApi, RecordsApi } from '@/services/pyApi';
import { formatIndianCurrency } from '@/utils/currency';
import { toast } from 'react-hot-toast';

interface Assignment {
  id: string;
  status: string;
  assigned_at: string;
  expires_at: string;
  responded_at: string;
  notes: string;
  inquiries: {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    inquiry_type: string;
    properties: {
      id: string;
      title: string;
      address: string;
      city: string;
      state: string;
      price: number;
      monthly_rent: number;
      listing_type: string;
      property_type: string;
      bedrooms: number;
      bathrooms: number;
      area_sqft: number;
      images: string[];
    };
  };
}

const AgentAssignments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshKey] = useState(0);

  useEffect(() => {
    if (!user || (user as any).user_type !== 'agent') {
      setTimeout(() => {
        navigate('/');
      }, 100);
      return;
    }

    fetchAssignments();
    
  // Realtime removed; rely on polling/refreshKey

    // Handle direct action from email link
    const assignmentId = searchParams.get('assignment');
    const action = searchParams.get('action');
    
    if (assignmentId && action) {
      handleDirectAction(assignmentId, action);
    }
    
  return () => {};
  }, [user, navigate, searchParams, refreshKey]);

  const fetchAssignments = async () => {
    if (!user) return;

    try {
      const [inquiries, properties] = await Promise.all([
        AdminApi.inquiries(),
        RecordsApi.listProperties(),
      ]);
      const myInquiries = (inquiries as any[]).filter(i => String(i.assigned_agent_id || i.agent_id) === String(user.id));
      // Synthesize assignments from inquiries and property fields present
      const propMap = new Map((properties as any[]).map(p => [String(p.id), p]));
      const mapped: Assignment[] = myInquiries.map((inq: any) => {
        const prop = propMap.get(String(inq.property_id)) || {};
        return {
          id: String(inq.id),
          status: (inq.assignment_status || 'pending') as any,
          assigned_at: inq.assigned_at || inq.created_at,
          expires_at: inq.expires_at || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          responded_at: inq.responded_at || null,
          notes: inq.assignment_notes || '',
          inquiries: {
            id: String(inq.id),
            name: inq.name,
            email: inq.email,
            phone: inq.phone,
            message: inq.message,
            inquiry_type: inq.inquiry_type,
            properties: {
              id: prop.id,
              title: prop.title,
              address: prop.address,
              city: prop.city,
              state: prop.state,
              price: prop.price,
              monthly_rent: prop.monthly_rent,
              listing_type: prop.listing_type,
              property_type: prop.property_type,
              bedrooms: prop.bedrooms,
              bathrooms: prop.bathrooms,
              area_sqft: prop.area_sqft,
              images: prop.images || [],
            },
          },
        } as any;
      });
      // order by assigned_at desc
      mapped.sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());
      setAssignments(mapped);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAction = async (assignmentId: string, action: string) => {
    if (action === 'accept') {
      await handleResponse(assignmentId, 'accepted');
    } else if (action === 'decline') {
      await handleResponse(assignmentId, 'declined');
    }
  };

  const handleResponse = async (assignmentId: string, response: 'accepted' | 'declined', notes?: string) => {
    setActionLoading(assignmentId);
    
    try {
      // Update via Python API
      const { pyFetch } = await import('@/utils/backend');
      await pyFetch(`/api/admin/inquiries/${assignmentId}/agent-response`, { method: 'POST', body: JSON.stringify({ status: response, notes }), useApiKey: true });

      toast.success(response === 'accepted' ? 'Assignment accepted successfully!' : 'Assignment declined');
      fetchAssignments();
      navigate('/agent/assignments', { replace: true });
    } catch (error) {
      console.error('Error responding to assignment:', error);
      toast.error('Failed to respond to assignment. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired && status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }

    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      declined: { color: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { color: 'bg-gray-100 text-gray-800', icon: Clock },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen pt-[90px]">
          <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-16">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 py-6 px-4">
          <button
            onClick={() => navigate('/agent/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-[#061D58] mb-2">My Assignments</h1>
          <p className="text-gray-600">Manage your property inquiry assignments</p>
        </div>

        <div className="px-4 py-8">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No assignments yet</h3>
              <p className="text-gray-600">You'll receive assignments when customers inquire about properties.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {assignments.map((assignment) => {
                const inquiry = assignment.inquiries;
                const property = inquiry.properties;
                const isExpired = new Date(assignment.expires_at) < new Date();
                const isPending = assignment.status === 'pending' && !isExpired;

                return (
                  <div key={assignment.id} className="professional-card p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Property Image */}
                      <div className="lg:w-1/4">
                        <img
                          src={property.images?.[0] || 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'}
                          alt={property.title}
                          className="w-full h-48 lg:h-32 object-cover rounded-lg"
                        />
                      </div>

                      {/* Assignment Details */}
                      <div className="lg:w-3/4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {property.title}
                            </h3>
                            <div className="flex items-center text-gray-600 mb-2">
                              <MapPin size={16} className="mr-1" />
                              <span className="text-sm">{property.address}, {property.city}</span>
                            </div>
                            <p className="text-[#90C641] font-bold text-lg">
                              {property.listing_type === 'SALE' 
                                ? formatIndianCurrency(property.price)
                                : `${formatIndianCurrency(property.monthly_rent)}/month`
                              }
                            </p>
                          </div>
                          <div className="mt-4 sm:mt-0 flex flex-col items-end">
                            {getStatusBadge(assignment.status, assignment.expires_at)}
                            {isPending && (
                              <p className="text-xs text-orange-600 mt-1">
                                {getTimeRemaining(assignment.expires_at)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Property Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2">Property Details</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Type:</strong> {property.property_type}</p>
                              <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
                              <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
                              <p><strong>Area:</strong> {property.area_sqft} sqft</p>
                              <p><strong>Inquiry Type:</strong> 
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                  inquiry.inquiry_type === 'purchase' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {inquiry.inquiry_type?.charAt(0).toUpperCase() + inquiry.inquiry_type?.slice(1)}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2">Customer Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center">
                                <User size={16} className="mr-2 text-[#90C641]" />
                                <span>{inquiry.name}</span>
                              </div>
                              <div className="flex items-center">
                                <Mail size={16} className="mr-2 text-[#90C641]" />
                                <span>{inquiry.email}</span>
                              </div>
                              <div className="flex items-center">
                                <Phone size={16} className="mr-2 text-[#90C641]" />
                                <span>{inquiry.phone}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Customer Message */}
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Customer Message</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{inquiry.message}</p>
                        </div>

                        {/* Assignment Info */}
                        <div className="text-xs text-gray-500 mb-4">
                          <p>Assigned on {new Date(assignment.assigned_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                          {assignment.responded_at && (
                            <p>Responded on {new Date(assignment.responded_at).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleResponse(assignment.id, 'accepted')}
                                disabled={actionLoading === assignment.id}
                                className="bg-[#90C641] text-white px-6 py-2 rounded-full hover:bg-[#7DAF35] transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
                              >
                                {actionLoading === assignment.id ? (
                                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />
                                ) : (
                                  <CheckCircle size={16} className="mr-2" />
                                )}
                                Accept Assignment
                              </button>
                              
                              <button
                                onClick={() => handleResponse(assignment.id, 'declined')}
                                disabled={actionLoading === assignment.id}
                                className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
                              >
                                {actionLoading === assignment.id ? (
                                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />
                                ) : (
                                  <XCircle size={16} className="mr-2" />
                                )}
                                Decline
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => navigate(buildPropertyUrl(property.title, property.id))}
                            className="bg-[#3B5998] text-white px-6 py-2 rounded-full hover:bg-[#2d4373] transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center"
                          >
                            <Home size={16} className="mr-2" />
                            View Property
                          </button>

                          {assignment.status === 'accepted' && (
                            <a
                              href={`mailto:${inquiry.email}?subject=Regarding your property inquiry&body=Hi ${inquiry.name},%0D%0A%0D%0AThank you for your inquiry about ${property.title}. I'm your assigned agent and I'd be happy to help you with this property.%0D%0A%0D%0ABest regards`}
                              className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center"
                            >
                              <Mail size={16} className="mr-2" />
                              Contact Customer
                            </a>
                          )}
                        </div>

                        {assignment.notes && (
                          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {assignment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AgentAssignments;