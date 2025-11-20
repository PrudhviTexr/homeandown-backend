import React, { useState, useEffect } from 'react';
import { 
  Target, CheckCircle, MessageCircle, DollarSign, Home, Users, Calendar, 
  TrendingUp, Star, Clock, MapPin, Phone, Mail, Bell, Settings, 
  FileText, Award, BarChart3, Eye, Edit, Plus, Filter, Search
} from 'lucide-react';
import { getApiUrl } from '@/utils/backend';
import { formatIndianCurrency } from '@/utils/currency';
import PropertyAssignmentPanel from '@/components/agent/PropertyAssignmentPanel';

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

interface InterestedClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyTitle: string;
  inquiryDate: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
}

interface AssignedProperty {
  id: string;
  title: string;
  price: number;
  monthlyRent?: number;
  address: string;
  city: string;
  state: string;
  assignmentDate: string;
  status: 'active' | 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

interface RecentInquiry {
  id: string;
  clientName: string;
  propertyTitle: string;
  message: string;
  inquiryDate: string;
  status: 'new' | 'contacted' | 'interested' | 'not_interested';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'inquiry' | 'booking' | 'commission' | 'system';
  read: boolean;
  createdAt: string;
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
  
  const [interestedClients, setInterestedClients] = useState<InterestedClient[]>([]);
  const [assignedProperties, setAssignedProperties] = useState<AssignedProperty[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'clients' | 'earnings'>('overview');

  useEffect(() => {
    fetchAgentDashboard();
  }, []);

  const fetchAgentDashboard = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from dedicated agent dashboard endpoint first
      try {
        const response = await fetch(getApiUrl('/api/admin/agent/dashboard/stats'), {
          headers: {
            'X-API-Key': import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats || data);
          setInterestedClients(data.interestedClients || []);
          setAssignedProperties(data.assignedProperties || []);
          setRecentInquiries(data.recentInquiries || []);
          setNotifications(data.notifications || []);
          return;
        }
      } catch (error) {
        console.log('Dedicated agent dashboard endpoint not available, using fallback');
      }
      
      // Fallback: Calculate stats from individual API calls
      await calculateDashboardStats();
      
    } catch (error) {
      console.error('Error fetching agent dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = async () => {
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      // Fetch inquiries
      const inquiriesResponse = await fetch(getApiUrl('/api/admin/inquiries'), { headers });
      const inquiries = inquiriesResponse.ok ? await inquiriesResponse.json() : [];
      
      // Fetch bookings
      const bookingsResponse = await fetch(getApiUrl('/api/admin/bookings'), { headers });
      const bookings = bookingsResponse.ok ? await bookingsResponse.json() : [];
      
      // Fetch properties
      const propertiesResponse = await fetch(getApiUrl('/api/properties'), { headers });
      const properties = propertiesResponse.ok ? await propertiesResponse.json() : [];

      // Filter data for current agent
      const agentId = user?.id;
      const agentInquiries = inquiries.filter((inq: any) => inq.assigned_agent_id === agentId);
      const agentBookings = bookings.filter((booking: any) => booking.agent_id === agentId);
      const agentProperties = properties.filter((prop: any) => prop.agent_id === agentId || prop.assigned_agent_id === agentId);

      // Calculate stats
      const monthlyCommission = agentBookings.reduce((total: number, booking: any) => {
        const commissionRate = booking.commission_rate || 0.02;
        const propertyPrice = booking.property_price || 0;
        return total + (propertyPrice * commissionRate);
      }, 0);

      const totalEarnings = agentBookings.reduce((total: number, booking: any) => {
        const commissionRate = booking.commission_rate || 0.02;
        const propertyPrice = booking.property_price || 0;
        return total + (propertyPrice * commissionRate);
      }, 0);

      setStats({
        totalProperties: agentProperties.length,
        assignedProperties: agentProperties.filter((p: any) => p.assignment_status === 'assigned').length,
        totalInquiries: agentInquiries.length,
        totalBookings: agentBookings.length,
        monthlyCommission,
        totalEarnings,
        responseRate: agentInquiries.length > 0 ? Math.round((agentInquiries.filter((inq: any) => inq.status !== 'new').length / agentInquiries.length) * 100) : 0,
        clientSatisfaction: 85 // Placeholder - would come from reviews/ratings
      });

      // Set interested clients
      setInterestedClients(agentInquiries.slice(0, 5).map((inq: any) => ({
        id: inq.id,
        name: inq.name || 'Unknown Client',
        email: inq.email || '',
        phone: inq.phone || '',
        propertyTitle: inq.property_title || 'Property Inquiry',
        inquiryDate: inq.created_at,
        status: inq.status,
        priority: inq.priority || 'medium'
      })));

      // Set assigned properties
      setAssignedProperties(agentProperties.slice(0, 5).map((prop: any) => ({
        id: prop.id,
        title: prop.title,
        price: prop.price || 0,
        monthlyRent: prop.monthly_rent,
        address: prop.address,
        city: prop.city,
        state: prop.state,
        assignmentDate: prop.assignment_date || prop.created_at,
        status: prop.assignment_status || 'active',
        priority: prop.priority || 'medium'
      })));

      // Set recent inquiries
      setRecentInquiries(agentInquiries.slice(0, 5).map((inq: any) => ({
        id: inq.id,
        clientName: inq.name || 'Unknown Client',
        propertyTitle: inq.property_title || 'Property Inquiry',
        message: inq.message || '',
        inquiryDate: inq.created_at,
        status: inq.status
      })));

    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
    }
  };

  const fetchInterestedClients = async () => {
    try {
      const response = await fetch(getApiUrl('/api/admin/inquiries'), {
        headers: {
          'X-API-Key': import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj'
        }
      });
      
      if (response.ok) {
        const inquiries = await response.json();
        const agentInquiries = inquiries.filter((inq: any) => inq.assigned_agent_id === user?.id);
        
        setInterestedClients(agentInquiries.slice(0, 10).map((inq: any) => ({
          id: inq.id,
          name: inq.name || 'Unknown Client',
          email: inq.email || '',
          phone: inq.phone || '',
          propertyTitle: inq.property_title || 'Property Inquiry',
          inquiryDate: inq.created_at,
          status: inq.status,
          priority: inq.priority || 'medium'
        })));
      }
    } catch (error) {
      console.error('Error fetching interested clients:', error);
    }
  };

  const fetchAssignedProperties = async () => {
    try {
      const response = await fetch(getApiUrl('/api/properties'), {
        headers: {
          'X-API-Key': import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj'
        }
      });
      
      if (response.ok) {
        const properties = await response.json();
        const agentProperties = properties.filter((prop: any) => prop.agent_id === user?.id || prop.assigned_agent_id === user?.id);
        
        setAssignedProperties(agentProperties.slice(0, 10).map((prop: any) => ({
          id: prop.id,
          title: prop.title,
          price: prop.price || 0,
          monthlyRent: prop.monthly_rent,
          address: prop.address,
          city: prop.city,
          state: prop.state,
          assignmentDate: prop.assignment_date || prop.created_at,
          status: prop.assignment_status || 'active',
          priority: prop.priority || 'medium'
        })));
      }
    } catch (error) {
      console.error('Error fetching assigned properties:', error);
    }
  };

  const fetchRecentInquiries = async () => {
    try {
      const response = await fetch(getApiUrl('/api/admin/inquiries'), {
        headers: {
          'X-API-Key': import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj'
        }
      });
      
      if (response.ok) {
        const inquiries = await response.json();
        const agentInquiries = inquiries.filter((inq: any) => inq.assigned_agent_id === user?.id);
        
        setRecentInquiries(agentInquiries.slice(0, 5).map((inq: any) => ({
          id: inq.id,
          clientName: inq.name || 'Unknown Client',
          propertyTitle: inq.property_title || 'Property Inquiry',
          message: inq.message || '',
          inquiryDate: inq.created_at,
          status: inq.status
        })));
      }
    } catch (error) {
      console.error('Error fetching recent inquiries:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(getApiUrl('/api/admin/notifications'), {
        headers: {
          'X-API-Key': import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj'
        }
      });
      
      if (response.ok) {
        const notifications = await response.json();
        const agentNotifications = notifications.filter((notif: any) => notif.user_id === user?.id);
        
        setNotifications(agentNotifications.slice(0, 10).map((notif: any) => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: notif.read || false,
          createdAt: notif.created_at
        })));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleContactClient = async (inquiryId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/inquiries/${inquiryId}/agent-response`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj'
        },
        body: JSON.stringify({
          response: 'Agent contacted client',
          status: 'contacted'
        })
      });
      
      if (response.ok) {
        // Refresh inquiries
        fetchRecentInquiries();
        fetchInterestedClients();
      }
    } catch (error) {
      console.error('Error contacting client:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-50';
      case 'contacted': return 'text-yellow-600 bg-yellow-50';
      case 'interested': return 'text-green-600 bg-green-50';
      case 'not_interested': return 'text-red-600 bg-red-50';
      case 'active': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.first_name || 'Agent'}!
            </h1>
            <p className="text-blue-100 mt-1">
              {agentProfile?.license_number ? `License: ${agentProfile.license_number}` : 'Professional Real Estate Agent'}
            </p>
            <p className="text-blue-100 text-sm mt-1">
              Status: <span className="font-semibold capitalize">{user?.status || 'Active'}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.totalProperties}</div>
            <div className="text-blue-100">Properties Assigned</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
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

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
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

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Commission</p>
              <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(stats.monthlyCommission)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Rate</span>
              <span className="text-sm font-semibold text-gray-900">{stats.responseRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${stats.responseRate}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Client Satisfaction</span>
              <span className="text-sm font-semibold text-gray-900">{stats.clientSatisfaction}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${stats.clientSatisfaction}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Plus className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <span className="text-sm text-blue-600 font-medium">New Property</span>
            </button>
            <button className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <span className="text-sm text-green-600 font-medium">Add Client</span>
            </button>
            <button className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <span className="text-sm text-purple-600 font-medium">Schedule Tour</span>
            </button>
            <button className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <BarChart3 className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
              <span className="text-sm text-yellow-600 font-medium">Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Property Assignments */}
      <PropertyAssignmentPanel 
        agentId={user?.id}
        onAssignmentUpdate={fetchAssignedProperties}
      />

      {/* Recent Inquiries */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Inquiries</h3>
            <button 
              onClick={fetchRecentInquiries}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="p-6">
          {recentInquiries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent inquiries</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInquiries.map((inquiry) => (
                <div key={inquiry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{inquiry.clientName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                        {inquiry.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{inquiry.propertyTitle}</p>
                    <p className="text-xs text-gray-500">{inquiry.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{new Date(inquiry.inquiryDate).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleContactClient(inquiry.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assigned Properties */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Assigned Properties</h3>
            <button 
              onClick={fetchAssignedProperties}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="p-6">
          {assignedProperties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No properties assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedProperties.map((property) => (
                <div key={property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{property.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(property.priority)}`}>
                      {property.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{property.address}, {property.city}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-600">
                      {property.price ? formatIndianCurrency(property.price) : 
                       property.monthlyRent ? `₹${property.monthlyRent.toLocaleString()}/month` : 'Price on request'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                      {property.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <button 
              onClick={fetchNotifications}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="p-6">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className={`p-4 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;