import React, { useState, useEffect } from 'react';
import { Users, Building2, Calendar, MessageSquare, UserCheck, AlertTriangle, MapPin, DollarSign, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { AdminApi } from '@/services/pyApi';
import toast from 'react-hot-toast';

interface EnhancedDashboardProps {
  onRefresh: () => void;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ onRefresh }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalInquiries: 0,
    pendingApprovals: 0,
    unassignedProperties: 0,
    activeAgents: 0,
    verifiedProperties: 0
  });
  
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [statsData, usersData, propertiesData, bookingsData, inquiriesData] = await Promise.all([
        AdminApi.stats(),
        AdminApi.users(),
        AdminApi.properties(),
        AdminApi.listBookings(),
        AdminApi.listInquiries()
      ]);

      console.log('Dashboard data:', { statsData, usersData, propertiesData, bookingsData, inquiriesData });

      setUsers(usersData || []);
      setProperties(propertiesData || []);
      setBookings(bookingsData || []);
      setInquiries(inquiriesData || []);

      // NEW: Log the raw stats data from the API
      console.log('Stats data from API:', statsData);

      // Calculate stats from fetched data in case stats endpoint fails
      const unassignedProps = (propertiesData || []).filter(p => !p.agent_id).length;
      const verifiedProps = (propertiesData || []).filter(p => p.verified).length;
      const activeAgents = (usersData || []).filter(u => u.user_type === 'agent' && u.verification_status === 'verified').length;
      const pendingUsers = (usersData || []).filter(u => u.verification_status === 'pending').length;

      // Ensure statsData is an object before trying to access its properties
      const safeStatsData = statsData && typeof statsData === 'object' ? statsData : {};

      setStats({
        totalUsers: safeStatsData.total_users ?? (usersData || []).length,
        totalProperties: safeStatsData.total_properties ?? (propertiesData || []).length,
        totalBookings: safeStatsData.total_bookings ?? (bookingsData || []).length,
        totalInquiries: safeStatsData.total_inquiries ?? (inquiriesData || []).length,
        pendingApprovals: safeStatsData.pending_approvals ?? pendingUsers,
        unassignedProperties: unassignedProps,
        activeAgents: activeAgents,
        verifiedProperties: verifiedProps
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getPropertyStats = (propertyId: string) => {
    const propertyInquiries = inquiries.filter(i => i.property_id === propertyId);
    const propertyBookings = bookings.filter(b => b.property_id === propertyId);
    return {
      inquiries: propertyInquiries.length,
      bookings: propertyBookings.length
    };
  };

  const getAgentName = (agentId: string) => {
    const agent = users.find(u => u.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unassigned';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
        <span className="ml-2">Loading comprehensive dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete platform overview and management</p>
        </div>
        <button 
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh All Data
        </button>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500">{stats.pendingApprovals} pending approval</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
              <p className="text-xs text-gray-500">{stats.unassignedProperties} unassigned</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-xs text-gray-500">Property tours</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
              <p className="text-xs text-gray-500">Customer inquiries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Assignment Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Property Assignment Overview</h3>
          <p className="text-sm text-gray-600 mt-1">Complete visibility of property assignments and performance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-medium text-gray-600">Property</th>
                <th className="text-left p-4 font-medium text-gray-600">Location</th>
                <th className="text-left p-4 font-medium text-gray-600">Price</th>
                <th className="text-left p-4 font-medium text-gray-600">Assigned Agent</th>
                <th className="text-left p-4 font-medium text-gray-600">Status</th>
                <th className="text-left p-4 font-medium text-gray-600">Inquiries</th>
                <th className="text-left p-4 font-medium text-gray-600">Bookings</th>
                <th className="text-left p-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => {
                const propertyStats = getPropertyStats(property.id);
                return (
                  <tr key={property.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900">{property.title}</div>
                        <div className="text-sm text-gray-500">{property.property_type}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.city}, {property.state}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ₹{property.price?.toLocaleString() || property.monthly_rent?.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      {property.agent_id ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getAgentName(property.agent_id)}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {property.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {propertyStats.inquiries}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {propertyStats.bookings}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unassigned Properties */}
      {stats.unassignedProperties > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-yellow-900">Unassigned Properties</h3>
              <p className="text-yellow-800 mt-1">
                {stats.unassignedProperties} properties are not assigned to any agent. 
                <button className="ml-2 text-yellow-900 underline hover:text-yellow-700">
                  Assign agents now
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{getUserName(booking.user_id)}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Inquiries</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {inquiries.slice(0, 5).map((inquiry) => (
                <div key={inquiry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{inquiry.name || 'Anonymous'}</div>
                    <div className="text-sm text-gray-500">{inquiry.email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {inquiry.message?.substring(0, 50)}...
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    inquiry.status === 'responded' ? 'bg-green-100 text-green-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inquiry.status || 'new'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Performance Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Agent Performance Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {users.filter(u => u.user_type === 'agent').map((agent) => {
              const agentProperties = properties.filter(p => p.agent_id === agent.id);
              const agentInquiries = inquiries.filter(i => agentProperties.some(p => p.id === i.property_id));
              const agentBookings = bookings.filter(b => agentProperties.some(p => p.id === b.property_id));
              
              return (
                <div key={agent.id} className="border rounded-lg p-4">
                  <div className="font-medium text-gray-900">{agent.first_name} {agent.last_name}</div>
                  <div className="text-sm text-gray-500">{agent.email}</div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Properties:</span>
                      <span className="font-medium">{agentProperties.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Inquiries:</span>
                      <span className="font-medium">{agentInquiries.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bookings:</span>
                      <span className="font-medium">{agentBookings.length}</span>
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agent.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agent.verification_status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
