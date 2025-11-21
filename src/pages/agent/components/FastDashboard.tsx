import React, { useState, useEffect } from 'react';
import { 
  Target, CheckCircle, MessageCircle, DollarSign, Home, Users, Calendar, 
  TrendingUp, Star, Clock, MapPin, Phone, Mail, Bell, Settings, 
  FileText, Award, BarChart3, Eye, Edit, Plus, Filter, Search, AlertCircle, XCircle, Download, RefreshCw
} from 'lucide-react';
import { getApiUrl } from '@/utils/backend';
import { formatIndianCurrency } from '@/utils/currency';
import { useNavigate } from 'react-router-dom';

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
  const [agentProfileData, setAgentProfileData] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds for real-time data
    const interval = setInterval(() => {
      console.log('[FastDashboard] Auto-refreshing data...');
      fetchDashboardData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [user]);
  
  // Also refresh when component remounts (via key prop from parent)
  useEffect(() => {
    // This will trigger when parent refreshes (key changes)
    fetchDashboardData();
  }, []);
  
  // Expose refresh function for manual refresh
  const handleManualRefresh = () => {
    fetchDashboardData();
  };

  // Handle assignment acceptance/rejection
  const handleAcceptAssignment = async (notificationId: string) => {
    try {
      const { AgentApi } = await import('@/services/pyApi');
      const toast = (await import('react-hot-toast')).default;
      const response = await AgentApi.acceptPropertyAssignment(notificationId);
      if (response?.success) {
        console.log('[FastDashboard] Assignment accepted:', notificationId);
        toast.success('Property assignment accepted successfully!');
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        toast.error(response?.error || 'Failed to accept assignment');
      }
    } catch (error: any) {
      console.error('[FastDashboard] Error accepting assignment:', error);
      const toast = (await import('react-hot-toast')).default;
      toast.error(error?.message || 'Failed to accept assignment. Please try again.');
    }
  };

  const handleRejectAssignment = async (notificationId: string) => {
    try {
      const reason = prompt('Please provide a reason for rejection (optional):') || 'No reason provided';
      const { AgentApi } = await import('@/services/pyApi');
      const toast = (await import('react-hot-toast')).default;
      const response = await AgentApi.rejectPropertyAssignment(notificationId, reason);
      if (response?.success) {
        console.log('[FastDashboard] Assignment rejected:', notificationId);
        toast.success('Property assignment rejected');
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        toast.error(response?.error || 'Failed to reject assignment');
      }
    } catch (error: any) {
      console.error('[FastDashboard] Error rejecting assignment:', error);
      const toast = (await import('react-hot-toast')).default;
      toast.error(error?.message || 'Failed to reject assignment. Please try again.');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('[FastDashboard] Fetching data for agent:', user.id);
      
      const { AgentApi } = await import('@/services/pyApi');
      
      // Fetch all data in parallel with higher limits to get more data
      const [profileRes, statsRes, propertiesRes, inquiriesRes, bookingsRes, assignmentsRes] = await Promise.allSettled([
        AgentApi.getAgentProfile(),
        AgentApi.getDashboardStats(),
        AgentApi.getProperties(undefined, 50), // Get up to 50 properties
        AgentApi.getInquiries(undefined, undefined, 50), // Get up to 50 inquiries
        AgentApi.getBookings(undefined, undefined, 50), // Get up to 50 bookings
        AgentApi.getPendingPropertyAssignments()
      ]);
      
      console.log('[FastDashboard] All API responses received');
      console.log('[FastDashboard] Profile:', profileRes.status);
      console.log('[FastDashboard] Stats:', statsRes.status);
      console.log('[FastDashboard] Properties:', propertiesRes.status);
      console.log('[FastDashboard] Inquiries:', inquiriesRes.status);
      console.log('[FastDashboard] Bookings:', bookingsRes.status);
      console.log('[FastDashboard] Assignments:', assignmentsRes.status);

      // Process profile
      if (profileRes.status === 'fulfilled') {
        console.log('[FastDashboard] Profile fetched:', profileRes.value);
        setAgentProfileData(profileRes.value.user);
        setDocuments(profileRes.value.documents || []);
      } else {
        console.error('[FastDashboard] Error fetching profile:', profileRes.reason);
      }

      // Process dashboard stats
      if (statsRes.status === 'fulfilled') {
        const statsData = statsRes.value?.stats || statsRes.value || {};
        console.log('[FastDashboard] Stats fetched:', statsData);
        setStats(prev => ({
          ...prev,
          totalProperties: statsData.total_properties || 0,
          assignedProperties: statsData.active_properties || 0,
          totalInquiries: statsData.total_inquiries || 0,
          totalBookings: statsData.total_bookings || 0,
          responseRate: statsData.response_rate || statsData.avg_response_rate || 0,
          monthlyCommission: statsData.monthly_commission || statsData.total_commission || 0,
          totalEarnings: statsData.total_earnings || statsData.total_commission || 0,
          clientSatisfaction: statsData.customer_rating || statsData.client_satisfaction || 0
        }));
      } else {
        console.error('[FastDashboard] Error fetching stats:', statsRes.reason);
      }

      // Process properties
      if (propertiesRes.status === 'fulfilled') {
        const response = propertiesRes.value;
        console.log('[FastDashboard] Properties API response:', response);
        console.log('[FastDashboard] Properties response type:', typeof response);
        console.log('[FastDashboard] Properties response keys:', response ? Object.keys(response) : 'null');
        
        // Try multiple ways to extract properties
        let properties = [];
        if (response?.properties && Array.isArray(response.properties)) {
          properties = response.properties;
          console.log('[FastDashboard] Found properties in response.properties:', properties.length);
        } else if (Array.isArray(response)) {
          properties = response;
          console.log('[FastDashboard] Response is array directly:', properties.length);
        } else if (response?.data && Array.isArray(response.data)) {
          properties = response.data;
          console.log('[FastDashboard] Found properties in response.data:', properties.length);
        } else {
          console.warn('[FastDashboard] Could not extract properties from response:', response);
          properties = [];
        }
        
        console.log('[FastDashboard] Final properties array:', properties.length);
        console.log('[FastDashboard] Sample property:', properties[0]);
        
        // Sort by created_at descending to show most recent first
        const sortedProperties = [...properties].sort((a, b) => 
          new Date(b.created_at || b.createdAt || b.updated_at || b.updatedAt || 0).getTime() - 
          new Date(a.created_at || a.createdAt || a.updated_at || a.updatedAt || 0).getTime()
        );
        setAssignedProperties(sortedProperties.slice(0, 6)); // Show 6 properties
        console.log('[FastDashboard] Set assignedProperties:', sortedProperties.slice(0, 6).length);
        
        // Don't override stats if they were already set by statsRes
        if (statsRes.status !== 'fulfilled') {
          setStats(prev => ({
            ...prev,
            totalProperties: properties.length,
            assignedProperties: properties.length
          }));
        }
      } else {
        console.error('[FastDashboard] Error fetching properties:', propertiesRes.reason);
        console.error('[FastDashboard] Full error:', propertiesRes.reason);
        setAssignedProperties([]); // Set empty array on error
      }

      // Process inquiries
      if (inquiriesRes.status === 'fulfilled') {
        const response = inquiriesRes.value;
        console.log('[FastDashboard] Inquiries API response:', response);
        console.log('[FastDashboard] Inquiries response type:', typeof response);
        console.log('[FastDashboard] Inquiries response keys:', response ? Object.keys(response) : 'null');
        
        // Try multiple ways to extract inquiries
        let inquiries = [];
        if (response?.inquiries && Array.isArray(response.inquiries)) {
          inquiries = response.inquiries;
          console.log('[FastDashboard] Found inquiries in response.inquiries:', inquiries.length);
        } else if (Array.isArray(response)) {
          inquiries = response;
          console.log('[FastDashboard] Response is array directly:', inquiries.length);
        } else if (response?.data && Array.isArray(response.data)) {
          inquiries = response.data;
          console.log('[FastDashboard] Found inquiries in response.data:', inquiries.length);
        } else {
          console.warn('[FastDashboard] Could not extract inquiries from response:', response);
          inquiries = [];
        }
        
        console.log('[FastDashboard] Final inquiries array:', inquiries.length);
        console.log('[FastDashboard] Sample inquiry:', inquiries[0]);
        
        // Sort by created_at descending to show most recent first
        const sortedInquiries = [...inquiries].sort((a, b) => 
          new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()
        );
        setRecentInquiries(sortedInquiries.slice(0, 5)); // Show only 5 most recent
        console.log('[FastDashboard] Set recentInquiries:', sortedInquiries.slice(0, 5).length);
        
        // Don't override stats if they were already set by statsRes
        if (statsRes.status !== 'fulfilled') {
          setStats(prev => ({
            ...prev,
            totalInquiries: inquiries.length
          }));
        }
      } else {
        console.error('[FastDashboard] Error fetching inquiries:', inquiriesRes.reason);
        console.error('[FastDashboard] Full error:', inquiriesRes.reason);
        setRecentInquiries([]); // Set empty array on error
      }

      // Process bookings
      if (bookingsRes.status === 'fulfilled') {
        const response = bookingsRes.value;
        console.log('[FastDashboard] Bookings API response:', response);
        console.log('[FastDashboard] Bookings response type:', typeof response);
        console.log('[FastDashboard] Bookings response keys:', response ? Object.keys(response) : 'null');
        
        // Try multiple ways to extract bookings
        let bookings = [];
        if (response?.bookings && Array.isArray(response.bookings)) {
          bookings = response.bookings;
          console.log('[FastDashboard] Found bookings in response.bookings:', bookings.length);
        } else if (Array.isArray(response)) {
          bookings = response;
          console.log('[FastDashboard] Response is array directly:', bookings.length);
        } else if (response?.data && Array.isArray(response.data)) {
          bookings = response.data;
          console.log('[FastDashboard] Found bookings in response.data:', bookings.length);
        } else {
          console.warn('[FastDashboard] Could not extract bookings from response:', response);
          bookings = [];
        }
        
        console.log('[FastDashboard] Final bookings array:', bookings.length);
        console.log('[FastDashboard] Sample booking:', bookings[0]);
        
        // Sort by created_at descending to show most recent first
        const sortedBookings = [...bookings].sort((a, b) => 
          new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()
        );
        setRecentBookings(sortedBookings.slice(0, 5)); // Show only 5 most recent
        console.log('[FastDashboard] Set recentBookings:', sortedBookings.slice(0, 5).length);
        
        // Don't override stats if they were already set by statsRes
        if (statsRes.status !== 'fulfilled') {
          setStats(prev => ({
            ...prev,
            totalBookings: bookings.length
          }));
        }
      } else {
        console.error('[FastDashboard] Error fetching bookings:', bookingsRes.reason);
        console.error('[FastDashboard] Full error:', bookingsRes.reason);
        setRecentBookings([]); // Set empty array on error
      }
      
      // Process assignments
      if (assignmentsRes.status === 'fulfilled') {
        const assignmentsData = assignmentsRes.value;
        const assignments = assignmentsData?.notifications || assignmentsData?.assignments || assignmentsData || [];
        console.log('[FastDashboard] Pending assignments fetched:', assignments.length);
        console.log('[FastDashboard] Assignments data:', assignments);
        setPendingAssignments(Array.isArray(assignments) ? assignments : []);
      } else {
        console.error('[FastDashboard] Error fetching pending assignments:', assignmentsRes.reason);
        console.error('[FastDashboard] Full error:', assignmentsRes.reason);
        setPendingAssignments([]); // Set empty array on error
      }

      // Update stats with real-time data from API responses
      // Only update if stats weren't already set from statsRes
      if (statsRes.status !== 'fulfilled') {
        // Calculate from actual data if stats API failed
        const propertiesCount = propertiesRes.status === 'fulfilled' ? 
          ((propertiesRes.value?.properties || propertiesRes.value || []).length) : 0;
        const inquiriesCount = inquiriesRes.status === 'fulfilled' ? 
          ((inquiriesRes.value?.inquiries || inquiriesRes.value || []).length) : 0;
        const bookingsCount = bookingsRes.status === 'fulfilled' ? 
          ((bookingsRes.value?.bookings || bookingsRes.value || []).length) : 0;
        
        setStats(prev => ({
          ...prev,
          totalProperties: propertiesCount || prev.totalProperties,
          assignedProperties: propertiesCount || prev.assignedProperties,
          totalInquiries: inquiriesCount || prev.totalInquiries,
          totalBookings: bookingsCount || prev.totalBookings,
          responseRate: inquiriesCount > 0 ? ((bookingsCount / inquiriesCount) * 100) : 0,
          monthlyCommission: prev.monthlyCommission || 0,
          totalEarnings: prev.totalEarnings || 0,
          clientSatisfaction: prev.clientSatisfaction || 0
        }));
      }

    } catch (error) {
      console.error('[FastDashboard] Error fetching dashboard data:', error);
      console.error('[FastDashboard] Full error:', error);
      // Set empty state on error to prevent stale data
      setAssignedProperties([]);
      setRecentInquiries([]);
      setRecentBookings([]);
      setPendingAssignments([]);
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

      {/* Agent Profile & License Info */}
      {agentProfileData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Profile</h3>
            {loading && (
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Refreshing...
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Agent ID</p>
              <p className="text-md font-semibold text-gray-800 font-mono">{agentProfileData.custom_id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">License Number</p>
              <p className="text-md font-semibold text-gray-800 font-mono">
                {agentProfileData.agent_license_number || agentProfileData.license_number || agentProfileData.custom_id || 'Not Assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Profile Status</p>
              <p className={`text-md font-semibold capitalize ${
                agentProfileData.status === 'active' ? 'text-green-600' : 
                agentProfileData.status === 'inactive' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {agentProfileData.status || 'Pending'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Verification Status</p>
              <p className={`text-md font-semibold capitalize ${
                agentProfileData.verification_status === 'verified' ? 'text-green-600' : 
                agentProfileData.verification_status === 'rejected' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {agentProfileData.verification_status || 'Pending'}
              </p>
            </div>
          </div>
        </div>
      )}

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
        <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Inquiries</h3>
          <button
            onClick={() => navigate('/agent/dashboard?tab=inquiries')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>
        {recentInquiries.length > 0 ? (
          <div className="space-y-4">
            {recentInquiries.map((inquiry, index) => {
              const inquiryName = inquiry.name || 
                                 (inquiry.user ? `${inquiry.user.first_name || ''} ${inquiry.user.last_name || ''}`.trim() : '') ||
                                 'Anonymous';
              const inquiryEmail = inquiry.email || inquiry.user?.email || 'N/A';
              const inquiryPhone = inquiry.phone || inquiry.user?.phone_number || 'N/A';
              
              return (
              <div key={inquiry.id || index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{inquiryName}</p>
                      <p className="text-xs text-gray-600">{inquiry.property?.title || 'Property Inquiry'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {inquiry.message && (
                  <div className="mb-3 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">{inquiry.message.length > 150 ? inquiry.message.substring(0, 150) + '...' : inquiry.message}</p>
                </div>
                )}
                
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Contact Information:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{inquiryEmail}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{inquiryPhone}</span>
                    </div>
                  </div>
                  {inquiry.property && (
                    <div className="flex items-center space-x-2 mt-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                        {inquiry.property.city || 'N/A'}, {inquiry.property.state || 'N/A'}
                    </span>
                  </div>
                  )}
                </div>
                
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => {
                      if (inquiryEmail && inquiryEmail !== 'N/A') {
                        window.location.href = `mailto:${inquiryEmail}?subject=Property Inquiry - ${inquiry.property?.title || 'Property'}`;
                      } else {
                        import('react-hot-toast').then(({ default: toast }) => {
                          toast.error('Email not available for this client');
                        });
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors text-center"
                  >
                    Contact Client
                  </button>
                  <button
                    onClick={() => {
                      if (inquiryPhone && inquiryPhone !== 'N/A') {
                        window.location.href = `tel:${inquiryPhone}`;
                      } else {
                        import('react-hot-toast').then(({ default: toast }) => {
                          toast.error('Phone number not available for this client');
                        });
                      }
                    }}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors text-center"
                  >
                    Call Client
                  </button>
                  <button 
                    onClick={() => {
                      // Navigate to inquiries tab
                      navigate('/agent/dashboard?tab=inquiries');
                      // Store inquiry ID in sessionStorage for potential highlighting
                      if (inquiry.id) {
                        sessionStorage.setItem('selectedInquiryId', inquiry.id);
                      }
                    }}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No inquiries yet</p>
            <p className="text-gray-400 text-sm">Inquiries from your assigned properties will appear here</p>
        </div>
      )}
      </div>

      {/* Recent Bookings / Tours */}
        <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Bookings / Tours</h3>
          <button
            onClick={() => navigate('/agent/dashboard?tab=bookings')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>
        {recentBookings.length > 0 ? (
          <div className="space-y-4">
            {recentBookings.slice(0, 5).map((booking, index) => {
              // Get customer information from multiple sources
              const customerName = booking.customer?.name || 
                                 booking.name || 
                                 (booking.user ? `${booking.user.first_name || ''} ${booking.user.last_name || ''}`.trim() : '') ||
                                 'Guest';
              const customerEmail = booking.customer?.email || 
                                   booking.email || 
                                   booking.user?.email || 
                                   'N/A';
              const customerPhone = booking.customer?.phone || 
                                   booking.phone || 
                                   booking.user?.phone_number || 
                                   'N/A';
              
              return (
              <div key={booking.id || index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {customerName}
                        {booking.customer?.user_type && (
                          <span className="ml-2 text-xs text-gray-500">({booking.customer.user_type})</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600">{booking.property?.title || 'Property Booking'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-2 py-1 rounded text-xs font-medium mb-1 ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status?.toUpperCase() || 'PENDING'}
                    </span>
                    <span className="text-xs text-gray-500">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </span>
                  </div>
                </div>
                
                {/* Customer Contact Information */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Customer Contact:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{customerEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{customerPhone}</span>
                    </div>
                  </div>
                </div>
                
                {/* Tour Details */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Tour Schedule:</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 font-medium">{booking.booking_date || 'TBD'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 font-medium">{booking.booking_time || 'TBD'}</span>
                    </div>
                    {booking.property && (
                    <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 text-xs">
                          {booking.property.city || 'N/A'}, {booking.property.state || 'N/A'}
                      </span>
                    </div>
                    )}
                  </div>
                </div>
                
                {booking.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}
                
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => {
                      if (customerEmail && customerEmail !== 'N/A') {
                        window.location.href = `mailto:${customerEmail}?subject=Property Tour Inquiry - ${booking.property?.title || 'Property'}`;
                      } else {
                        import('react-hot-toast').then(({ default: toast }) => {
                          toast.error('Email not available for this client');
                        });
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors text-center"
                  >
                    Contact Client
                  </button>
                  <button
                    onClick={() => {
                      if (customerPhone && customerPhone !== 'N/A') {
                        window.location.href = `tel:${customerPhone}`;
                      } else {
                        import('react-hot-toast').then(({ default: toast }) => {
                          toast.error('Phone number not available for this client');
                        });
                      }
                    }}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors text-center"
                  >
                    Call Client
                  </button>
                  <button 
                    onClick={() => {
                      // Navigate to bookings tab and potentially scroll to this booking
                      navigate('/agent/dashboard?tab=bookings');
                      // Store booking ID in sessionStorage for potential highlighting
                      if (booking.id) {
                        sessionStorage.setItem('selectedBookingId', booking.id);
                      }
                    }}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No bookings yet</p>
            <p className="text-gray-400 text-sm">Tour bookings for your assigned properties will appear here</p>
        </div>
      )}
      </div>

      {/* Assigned Properties */}
        <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Assigned Properties</h3>
          <button
            onClick={() => navigate('/agent/dashboard?tab=properties')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>
        {assignedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedProperties.map((property, index) => (
              <div key={property.id || index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 flex-1">{property.title || 'Property'}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    property.status === 'active' ? 'bg-green-100 text-green-800' :
                    property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {property.status || 'pending'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {property.city || 'N/A'}, {property.state || 'N/A'}
                </p>
                <p className="text-lg font-bold text-blue-600 mb-2">
                  {property.listing_type === 'RENT' 
                    ? `₹${formatIndianCurrency(property.monthly_rent || 0)}/month`
                    : `₹${formatIndianCurrency(property.price || 0)}`
                  }
                </p>
                {property.property_type && (
                  <p className="text-xs text-gray-500 mb-2 capitalize">
                    Type: {property.property_type.replace(/_/g, ' ')}
                  </p>
                )}
                {(property.bedrooms || property.bathrooms) && (
                  <p className="text-xs text-gray-500 mb-3">
                    {property.bedrooms ? `${property.bedrooms} Beds` : ''} 
                    {property.bedrooms && property.bathrooms ? ' • ' : ''}
                    {property.bathrooms ? `${property.bathrooms} Baths` : ''}
                  </p>
                )}
                <div className="mt-3 flex space-x-2">
                  <button 
                    onClick={() => navigate(`/properties/${property.id}`)}
                    className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => navigate('/agent/dashboard?tab=properties')}
                    className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Home className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No properties assigned yet</p>
            <p className="text-gray-400 text-sm">Properties assigned to you will appear here</p>
        </div>
      )}
      </div>

      {/* Agent Documents */}
      {documents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Documents</h3>
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{doc.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{doc.document_category?.replace(/_/g, ' ') || 'Document'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(doc.public_url, '_blank')}
                    className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <a
                    href={doc.public_url}
                    download={doc.name}
                    className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
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
