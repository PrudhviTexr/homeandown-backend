import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Users, Mail, Phone, Clock, MapPin, Search, Filter, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from '@/components/ui/toast';
import { pyFetch } from '@/utils/backend';

interface Property {
  id: string;
  title: string;
  city: string;
  state: string;
  property_type: string;
  listing_type: string;
}

interface Inquiry {
  id: string;
  property_id: string;
  user_id: string;
  message: string;
  status: string;
  created_at: string;
  property: Property;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  };
}

const SellerInquiries: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquiryFilter, setInquiryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchInquiries = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setLoading(true);
      
      const fetchOptions = {
        useApiKey: false,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      };

      const inquiriesData = await pyFetch('/api/seller/inquiries', fetchOptions);
      if (inquiriesData?.inquiries) {
        setInquiries(inquiriesData.inquiries);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchInquiries();
    } else if (!user?.id) {
      hasFetchedRef.current = false;
    }
  }, [user?.id, fetchInquiries]);

  const handleInquiryResponse = async (inquiryId: string, response: string) => {
    if (!response || !response.trim()) {
      toast.error('Please enter a response message');
      return;
    }

    try {
      await pyFetch(`/api/seller/inquiries/${inquiryId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ message: response }),
        useApiKey: false
      });
      toast.success('Response sent successfully');
      fetchInquiries();
    } catch (error: any) {
      console.error('Error responding to inquiry:', error);
      toast.error(error?.message || 'Failed to send response');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'responded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesFilter = inquiryFilter === 'all' || inquiry.status === inquiryFilter;
    const matchesSearch = searchQuery === '' || 
      inquiry.property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0ca5e9] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inquiries...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/seller/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#90C641] rounded-full flex items-center justify-center mr-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Property Inquiries</h1>
                <p className="text-gray-600">View and respond to buyer inquiries</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by property, buyer name, email, or message..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={inquiryFilter}
                  onChange={(e) => setInquiryFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Inquiries</option>
                  <option value="pending">Pending</option>
                  <option value="responded">Responded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inquiries List */}
          <div className="space-y-4">
            {filteredInquiries.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Inquiries Found</h4>
                <p className="text-gray-600">
                  {inquiryFilter === 'all' && searchQuery === ''
                    ? "You don't have any inquiries yet. When buyers inquire about your properties, they'll appear here."
                    : `No ${inquiryFilter === 'all' ? '' : inquiryFilter} inquiries found${searchQuery ? ` matching "${searchQuery}"` : ''}.`
                  }
                </p>
              </div>
            ) : (
              filteredInquiries.map((inquiry) => (
                <div key={inquiry.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1 text-lg">{inquiry.property.title}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {inquiry.property.city}, {inquiry.property.state}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status}
                    </span>
                  </div>
                  
                  <div className="mb-4 space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-gray-700 text-sm leading-relaxed">{inquiry.message}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{inquiry.user.first_name} {inquiry.user.last_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${inquiry.user.email}`} className="hover:text-blue-600">
                          {inquiry.user.email}
                        </a>
                      </div>
                      {inquiry.user.phone_number && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${inquiry.user.phone_number}`} className="hover:text-blue-600">
                            {inquiry.user.phone_number}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        Inquired: {formatDate(inquiry.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    {inquiry.status === 'pending' && (
                      <button
                        onClick={() => {
                          const response = window.prompt('Enter your response to this inquiry:');
                          if (response) {
                            handleInquiryResponse(inquiry.id, response);
                          }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Respond
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/seller/property/${inquiry.property.id}`)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Home className="w-4 h-4" />
                      View Property
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SellerInquiries;

