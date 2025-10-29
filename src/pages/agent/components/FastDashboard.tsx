import React, { useState, useEffect } from 'react';
import { 
  Target, CheckCircle, MessageCircle, DollarSign, Home, Users, Calendar, 
  TrendingUp, Star, Clock, MapPin, Phone, Mail, Bell, Settings, 
  FileText, Award, BarChart3, Eye, Edit, Plus, Filter, Search
} from 'lucide-react';
import { getApiUrl } from '@/utils/backend';
import { formatIndianCurrency } from '@/utils/currency';

interface DashboardProps {
  user: any;
  agentProfile?: any;
}

interface DashboardStats {
  totalProperties: number;
  assignedProperties: number;
  totalInquiries: number;
  totalBookings: number;
  monthlyCommission: number;
  totalEarnings: number;
  responseRate: number;
  clientSatisfaction: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, agentProfile }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    assignedProperties: 0,
    totalInquiries: 0,
    totalBookings: 0,
    monthlyCommission: 0,
    totalEarnings: 0,
    responseRate: 0,
    clientSatisfaction: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [assignedProperties, setAssignedProperties] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('[FastDashboard] Fetching data for agent:', user.id);
      
      // Import pyFetch for proper API calls
      const { pyFetch } = await import('@/utils/backend');
      const { AgentApi } = await import('@/services/pyApi');
      
      // Fetch data in parallel using pyFetch for proper authentication
      const [propertiesRes, inquiriesRes, bookingsRes] = await Promise.allSettled([
        AgentApi.getProperties(),
        AgentApi.getInquiries(),
        AgentApi.getBookings()
      ]);

      // Process properties
      if (propertiesRes.status === 'fulfilled') {
        const response = propertiesRes.value;
        const properties = response?.properties || response || [];
        console.log('[FastDashboard] Properties fetched:', properties.length);
        setAssignedProperties(properties.slice(0, 5)); // Show only 5 recent
        setStats(prev => ({
          ...prev,
          totalProperties: properties.length,
          assignedProperties: properties.length
        }));
      } else {
        console.error('[FastDashboard] Error fetching properties:', propertiesRes.reason);
      }

      // Process inquiries
      if (inquiriesRes.status === 'fulfilled') {
        const response = inquiriesRes.value;
        const inquiries = response?.inquiries || response || [];
        console.log('[FastDashboard] Inquiries fetched:', inquiries.length);
        setRecentInquiries(inquiries.slice(0, 5)); // Show only 5 recent
        setStats(prev => ({
          ...prev,
          totalInquiries: inquiries.length
        }));
      } else {
        console.error('[FastDashboard] Error fetching inquiries:', inquiriesRes.reason);
      }

      // Process bookings
      if (bookingsRes.status === 'fulfilled') {
        const response = bookingsRes.value;
        const bookings = response?.bookings || response || [];
        console.log('[FastDashboard] Bookings fetched:', bookings.length);
        setRecentBookings(bookings.slice(0, 5)); // Show only 5 recent
        setStats(prev => ({
          ...prev,
          totalBookings: bookings.length
        }));
      } else {
        console.error('[FastDashboard] Error fetching bookings:', bookingsRes.reason);
      }

      // Calculate mock earnings (replace with real calculation)
      setStats(prev => ({
        ...prev,
        monthlyCommission: prev.assignedProperties * 50000 * 0.02, // 2% of property value
        totalEarnings: prev.assignedProperties * 50000 * 0.02 * 12, // Annual
        responseRate: 95,
        clientSatisfaction: 4.8
      }));

      // Fetch pending property assignments using pyFetch
      try {
        const { AgentApi } = await import('@/services/pyApi');
        const assignmentsData = await AgentApi.getPendingPropertyAssignments();
        const assignments = assignmentsData?.notifications || assignmentsData || [];
        console.log('[FastDashboard] Pending assignments fetched:', assignments.length);
        setPendingAssignments(assignments);
      } catch (assignError) {
        console.error('[FastDashboard] Error fetching pending assignments:', assignError);
      }

    } catch (error) {
      console.error('[FastDashboard] Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#90C641] to-[#7DAF35] rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.first_name || 'Agent'}! 👋
        </h1>
        <p className="text-green-100">
          Here's your performance overview for today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignedProperties}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatIndianCurrency(stats.monthlyCommission)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Rate</span>
              <span className="text-sm font-semibold text-green-600">{stats.responseRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Client Satisfaction</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-semibold text-gray-900 ml-1">{stats.clientSatisfaction}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Earnings</span>
              <span className="text-sm font-semibold text-green-600">
                {formatIndianCurrency(stats.totalEarnings)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-blue-900">View Clients</span>
            </button>
            <button className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <MessageCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-green-900">New Inquiry</span>
            </button>
            <button className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-purple-900">Schedule Tour</span>
            </button>
            <button className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <BarChart3 className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-yellow-900">Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Property Assignments */}
      {pendingAssignments.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Pending Property Assignments ({pendingAssignments.length})
            </h3>
            <span className="text-xs text-yellow-700 bg-yellow-200 px-2 py-1 rounded">
              Action Required - 5 min timeout
            </span>
          </div>
          <div className="space-y-4">
            {pendingAssignments.slice(0, 3).map((assignment) => {
              const expiresAt = new Date(assignment.expires_at);
              const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60));
              const isExpiringSoon = timeRemaining < 2;
              
              return (
                <div key={assignment.id} className={`bg-white rounded-lg p-4 border ${isExpiringSoon ? 'border-red-300' : 'border-yellow-300'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{assignment.property?.title || 'Property Assignment'}</h4>
                      <p className="text-sm text-gray-600">
                        Round {assignment.notification_round} • {assignment.property?.city}, {assignment.property?.state}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {timeRemaining > 0 ? `${timeRemaining} min left` : 'Expired'}
                    </span>
                  </div>
                  
                  {assignment.property && (
                    <div className="mb-3 text-sm text-gray-600">
                      <p><strong>Price:</strong> {assignment.property.price ? `₹${assignment.property.price.toLocaleString('en-IN')}` : 
                        assignment.property.monthly_rent ? `₹${assignment.property.monthly_rent.toLocaleString('en-IN')}/month` : 'Price on request'}</p>
                      <p><strong>Type:</strong> {assignment.property.property_type?.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptAssignment(assignment.id)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => navigate(`/agent/assignments/${assignment.id}/accept`)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleRejectAssignment(assignment.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
            {pendingAssignments.length > 3 && (
              <button
                onClick={() => navigate('/agent/assignments')}
                className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all {pendingAssignments.length} pending assignments →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Inquiries */}
      {recentInquiries.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Inquiries</h3>
          <div className="space-y-4">
            {recentInquiries.map((inquiry, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inquiry.name || inquiry.user?.first_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-600">{inquiry.property?.title || 'Property Inquiry'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-700">{inquiry.message?.substring(0, 100)}...</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{inquiry.email || inquiry.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{inquiry.phone || inquiry.user?.phone_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {inquiry.property?.city || 'N/A'}, {inquiry.property?.state || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                    Contact Client
                  </button>
                  <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                    View Property
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
          <div className="space-y-4">
            {recentBookings.map((booking, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.name || booking.user?.first_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-600">{booking.property?.title || 'Property Booking'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{booking.booking_date || 'TBD'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{booking.booking_time || 'TBD'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{booking.email || booking.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{booking.phone || booking.user?.phone_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {booking.property?.city || 'N/A'}, {booking.property?.state || 'N/A'}
                    </span>
                  </div>
                </div>
                
                {booking.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}
                
                <div className="mt-3 flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                    Contact Client
                  </button>
                  <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                    Confirm Tour
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Properties */}
      {assignedProperties.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedProperties.map((property, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-900 mb-2">{property.title}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {property.city}, {property.state}
                </p>
                <p className="text-lg font-bold text-blue-600">
                  {formatIndianCurrency(property.price || property.monthly_rent)}
                  {property.listing_type === 'RENT' && '/month'}
                </p>
                <div className="mt-3 flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                    View Details
                  </button>
                  <button className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
