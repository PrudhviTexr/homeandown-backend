import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, BarChart3, PieChart, Calendar,
  Filter, Search, Eye, MoreVertical, Download, User
} from 'lucide-react';
import { pyFetch } from '@/utils/backend';
import { formatCurrency } from '@/utils/adminHelpers';
import toast from 'react-hot-toast';

interface AgentEarning {
  agentId: string;
  agentName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  totalEarnings: number;
  monthlyEarnings: number;
  quarterlyEarnings: number;
  yearlyEarnings: number;
  totalBookings: number;
  successfulBookings: number;
  averageCommissionPerBooking: number;
  lastPaymentDate: string;
  status: 'active' | 'inactive' | 'suspended';
}

const AgentEarnings: React.FC = () => {
  const [earnings, setEarnings] = useState<AgentEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalEarnings' | 'monthlyEarnings' | 'totalBookings'>('totalEarnings');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchAgentEarnings();
  }, []);

  const fetchAgentEarnings = async () => {
    try {
      setLoading(true);
      
      // Fetch agent earnings data
      const response = await pyFetch('/api/admin/agents/earnings', {
        method: 'GET',
        headers: {
          'X-API-Key': import.meta.env.VITE_PY_API_KEY || 'your-api-key'
        }
      });
      
      if (response.success) {
        setEarnings(response.earnings || []);
      } else {
        toast.error(response.message || 'Failed to fetch agent earnings');
      }
      
    } catch (error) {
      console.error('Error fetching agent earnings:', error);
      toast.error('Failed to fetch agent earnings data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedEarnings = earnings
    .filter(earning => 
      earning.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Agent Earnings</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchAgentEarnings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="h-4 w-4 inline mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by agent name, email, or license number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="totalEarnings">Sort by Total Earnings</option>
            <option value="monthlyEarnings">Sort by Monthly Earnings</option>
            <option value="totalBookings">Sort by Total Bookings</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Agent Earnings Summary ({filteredAndSortedEarnings.length} agents)
          </h3>
        </div>
        
        {filteredAndSortedEarnings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {earnings.length === 0 ? 'No agent earnings data available' : 'No agents match your search criteria'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quarterly
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yearly
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg/Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedEarnings.map((earning) => (
                  <tr key={earning.agentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{earning.agentName}</div>
                          <div className="text-sm text-gray-500">{earning.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {earning.licenseNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(earning.totalEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(earning.monthlyEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(earning.quarterlyEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(earning.yearlyEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="text-sm font-medium">{earning.successfulBookings}</div>
                        <div className="text-xs text-gray-500">of {earning.totalBookings}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(earning.averageCommissionPerBooking)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(earning.status)}`}>
                        {earning.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredAndSortedEarnings.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">Total Earnings</p>
                <p className="text-xl font-semibold text-blue-800">
                  {formatCurrency(
                    filteredAndSortedEarnings.reduce((sum, e) => sum + e.totalEarnings, 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600">Monthly Earnings</p>
                <p className="text-xl font-semibold text-green-800">
                  {formatCurrency(
                    filteredAndSortedEarnings.reduce((sum, e) => sum + e.monthlyEarnings, 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600">Total Bookings</p>
                <p className="text-xl font-semibold text-purple-800">
                  {filteredAndSortedEarnings.reduce((sum, e) => sum + e.totalBookings, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <PieChart className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-orange-600">Avg per Booking</p>
                <p className="text-xl font-semibold text-orange-800">
                  {formatCurrency(
                    filteredAndSortedEarnings.reduce((sum, e) => sum + e.averageCommissionPerBooking, 0) / 
                    filteredAndSortedEarnings.length
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentEarnings;
