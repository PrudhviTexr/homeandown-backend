import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  User as UserIcon,
  Send,
  Eye,
} from 'lucide-react';
import { buildPropertyUrl } from '@/utils/url';
import { FALLBACK_IMAGE } from '@/utils/fallbackImage';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ViewInquiryModal from '@/components/client/ViewInquiryModal';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { pyFetch } from '@/utils/backend';
import toast from 'react-hot-toast';

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

const MyInquiries: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'responded' | 'closed'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      return; 
    }
    if ((user as any).user_type !== 'buyer') {
      navigate('/');
      return;
    }

    fetchInquiries();
    
    // Remove auto-refresh to prevent excessive API calls
    // const refreshInterval = setInterval(() => {
    //   fetchInquiries();
    // }, 30000); // Refresh every 30 seconds
    
    // return () => clearInterval(refreshInterval);
  }, [user, navigate, filter]);

  async function fetchInquiries() {
    if (!user) return;
    setLoading(true);

    try {
      console.log('[MyInquiries] Fetching inquiries for user:', user.id);
      
      // Fetch inquiries for current user
      const userId = (user as any).id;
      const data = await pyFetch(`/api/inquiries?user_id=${encodeURIComponent(userId)}`, { method: 'GET', useApiKey: false });
      
      console.log('[MyInquiries] Raw inquiries data:', data);
      
      // Filter inquiries for current user
      const userInquiries = (data || []).filter((inquiry: any) => 
        inquiry.user_id === user.id || inquiry.email === user.email
      );
      
      console.log('[MyInquiries] Filtered user inquiries:', userInquiries);
      
      // The API returns inquiries with property ids; try to expand property details for UI
      const expanded = await Promise.all(userInquiries.map(async (inq: any) => {
        let prop = null;
        let contactInfo = {
          first_name: 'Agent',
          last_name: 'Contact',
          email: 'contact@homeandown.com',
          phone_number: 'N/A'
        };
        
        try {
          prop = await pyFetch(`/api/properties/${inq.property_id}`, { method: 'GET', useApiKey: false });
          
          // Get agent/owner contact info
          if (prop) {
            // Try to get agent info first
            if (prop.assigned_agent_id || prop.agent_id) {
              try {
                const agentId = prop.assigned_agent_id || prop.agent_id;
                const agentData = await pyFetch(`/api/users/${agentId}`, { 
                  method: 'GET', 
                  useApiKey: false 
                });
                if (agentData) {
                  contactInfo = {
                    first_name: agentData.first_name || 'Agent',
                    last_name: agentData.last_name || 'Contact',
                    email: agentData.email || 'contact@homeandown.com',
                    phone_number: agentData.phone_number || 'N/A'
                  };
                }
              } catch (err) {
                console.log('[MyInquiries] Could not fetch agent info:', err);
              }
            }
            // Fallback to owner info if no agent
            else if (prop.owner_id) {
              try {
                const ownerData = await pyFetch(`/api/users/${prop.owner_id}`, { 
                  method: 'GET', 
                  useApiKey: false 
                });
                if (ownerData) {
                  contactInfo = {
                    first_name: ownerData.first_name || 'Owner',
                    last_name: ownerData.last_name || 'Contact',
                    email: ownerData.email || 'contact@homeandown.com',
                    phone_number: ownerData.phone_number || 'N/A'
                  };
                }
              } catch (err) {
                console.log('[MyInquiries] Could not fetch owner info:', err);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching property for inquiry:', err);
          prop = null;
        }
        
        return { 
          ...inq, 
          properties: prop ? {
            ...prop,
            users: contactInfo
          } : { 
            id: inq.property_id, 
            title: 'Property', 
            images: [],
            users: contactInfo
          } 
        };
      }));
      
      console.log('[MyInquiries] Expanded inquiries:', expanded);
      setInquiries(expanded);
    } catch (err) {
      console.error('Error fetching inquiries:', err); 
      toast.error('Failed to fetch inquiries');
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: Inquiry['status']) {
    const map = {
      new:       { color: 'bg-blue-100 text-blue-800',    icon: AlertCircle },
      responded: { color: 'bg-green-100 text-green-800',  icon: CheckCircle },
      closed:    { color: 'bg-gray-100 text-gray-800',    icon: CheckCircle },
    };
    const { color, icon: Icon } = map[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status[0].toUpperCase() + status.slice(1)}
      </span>
    );
  }

  async function handleSendFollowUp(propertyId: string) {
    const followUp = prompt('Enter your follow-up message:');
    if (!followUp) return;

    try {
      await pyFetch('/inquiries', {
        method: 'POST',
        useApiKey: true,
        body: JSON.stringify({
          property_id: propertyId,
          message: `Follow-up: ${followUp}`,
        })
      });
      fetchInquiries();
      alert('Follow-up sent!');
    } catch (err) {
      console.error('Error sending follow-up:', err);
      alert('Failed to send follow-up.');
    }
  }

  function handleViewInquiry(inq: Inquiry) {
    setSelectedInquiry(inq);
    setShowViewModal(true);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-[90px] flex justify-center">
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              navigate('/');
            }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-[90px] pb-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-[#061D58] mb-2">My Inquiries</h1>
            <p className="text-gray-600">Track your property inquiries</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all','new','responded','closed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === s ? 'bg-[#90C641] text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No inquiries found</h3>
              <p className="text-gray-600 mb-6">You haven’t sent any inquiries yet.</p>
              <button
                onClick={() => navigate('/buy')}
                className="bg-[#90C641] text-white px-6 py-3 rounded-lg"
              >
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {inquiries.map(i => (
                <div key={i.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Image */}
                    <div className="lg:w-1/4">
                      <img
                        src={i.properties.images?.[0] || FALLBACK_IMAGE}
                        alt={i.properties.title}
                        className="w-full h-48 lg:h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => navigate(buildPropertyUrl(i.properties.title, i.properties.id))}
                      />
                    </div>

                    {/* Details */}
                    <div className="lg:w-3/4 space-y-4">
                      {/* Title & Status */}
                      <div className="flex justify-between items-start">
                        <h3
                          className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-[#90C641]"
                          onClick={() => navigate(buildPropertyUrl(i.properties.title, i.properties.id))}
                        >
                          {i.properties.title}
                        </h3>
                          {getStatusBadge(i.status)}
                      </div>

                      {/* Your Message */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Your Message</h4>
                        <p className="text-gray-700 leading-relaxed">{i.message}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Sent on{' '}
                          {new Date(i.created_at).toLocaleString(undefined, {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Owner Contact */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Owner Contact</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center">
                            <UserIcon className="mr-2 text-[#90C641]" size={16} />
                            {i.properties.users.first_name} {i.properties.users.last_name}
                          </div>
                          <div className="flex items-center">
                            <Mail className="mr-2 text-[#90C641]" size={16} />
                            {i.properties.users.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="mr-2 text-[#90C641]" size={16} />
                            {i.properties.users.phone_number}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate(buildPropertyUrl(i.properties.title, i.properties.id))}
                          className="bg-[#90C641] text-white px-4 py-2 rounded-full hover:bg-[#7DAF35] transition"
                        >
                          View Property
                        </button>
                        <button
                          onClick={() => handleViewInquiry(i)}
                          className="bg-[#3B5998] text-white px-4 py-2 rounded-full hover:bg-[#2d4373] transition flex items-center"
                        >
                          <Eye size={16} className="mr-2" />
                          View Inquiry
                        </button>
                        <button
                          onClick={() => handleSendFollowUp(i.properties.id)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition flex items-center"
                        >
                          <Send size={14} className="mr-2"/> Send Follow-up
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ViewInquiryModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        inquiry={selectedInquiry}
      />
    </div>
  );
};

export default MyInquiries;
