import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Home,
  Calendar,
  Mail,
  DollarSign,
  Eye,
  Heart,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Activity,
} from 'lucide-react';
import { getApiUrl } from '@/utils/backend';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalProperties: number;
    totalBookings: number;
    totalInquiries: number;
    totalRevenue: number;
    activeListings: number;
  };
  trends: {
    usersGrowth: number;
    propertiesGrowth: number;
    bookingsGrowth: number;
  };
  usersByType: { name: string; value: number; color: string }[];
  propertiesByType: { name: string; value: number }[];
  bookingsByStatus: { name: string; value: number }[];
  monthlyData: {
    month: string;
    users: number;
    properties: number;
    bookings: number;
    inquiries: number;
  }[];
  topPerformingProperties: {
    id: string;
    title: string;
    views: number;
    inquiries: number;
    bookings: number;
  }[];
  recentActivity: {
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }[];
}

const AdvancedAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        getApiUrl(`/api/admin/analytics?range=${timeRange}`),
        {
          headers: {
            'X-API-Key': import.meta.env.PYTHON_API_KEY || '',
          },
        }
      );
      
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#0ca5e9] rounded-full"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, growth, color }: any) => (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {growth !== undefined && (
          <div
            className={`flex items-center text-sm font-semibold ${
              growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {growth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span className="ml-1">{Math.abs(growth)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your platform</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-[#0ca5e9] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={data.overview.totalUsers}
          growth={data.trends.usersGrowth}
          color="blue"
        />
        <StatCard
          icon={Home}
          title="Total Properties"
          value={data.overview.totalProperties}
          growth={data.trends.propertiesGrowth}
          color="green"
        />
        <StatCard
          icon={Calendar}
          title="Total Bookings"
          value={data.overview.totalBookings}
          growth={data.trends.bookingsGrowth}
          color="purple"
        />
        <StatCard
          icon={Mail}
          title="Total Inquiries"
          value={data.overview.totalInquiries}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#0ca5e9" name="Users" />
              <Line type="monotone" dataKey="properties" stroke="#10b981" name="Properties" />
              <Line type="monotone" dataKey="bookings" stroke="#8b5cf6" name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Users by Type */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Users by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.usersByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.usersByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Properties & Bookings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties by Type */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Properties by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.propertiesByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings by Status */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Bookings by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.bookingsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Properties */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Properties</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Inquiries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bookings
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topPerformingProperties.map((property) => (
                <tr key={property.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {property.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {property.views}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {property.inquiries}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {property.bookings}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {data.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
