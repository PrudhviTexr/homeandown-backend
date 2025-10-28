import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Users, TrendingUp, BarChart3, PieChart,
  CheckCircle, AlertCircle, Clock, Eye, MoreVertical
} from 'lucide-react';
import { pyFetch } from '@/utils/backend';
import { formatCurrency } from '@/utils/adminHelpers';
import toast from 'react-hot-toast';

interface CommissionSummary {
  totalAgents: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  averageCommissionRate: number;
  topPerformingAgent: string;
  monthlyCommission: number;
}

interface AgentCommission {
  agentId: string;
  agentName: string;
  licenseNumber: string;
  email: string;
  phone: string;
  commissionRate: number;
  totalBookings: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  lastPaymentDate: string;
  status: 'active' | 'inactive' | 'suspended';
}

const CommissionOverview: React.FC = () => {
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [agentCommissions, setAgentCommissions] = useState<AgentCommission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      
      // Fetch commission summary
      const summaryResponse = await pyFetch('/api/admin/commissions/summary', {
        method: 'GET',
        headers: {
          'X-API-Key': import.meta.env.VITE_PY_API_KEY || 'your-api-key'
        }
      });
      
      if (summaryResponse.success) {
        setSummary(summaryResponse.summary);
      }

      // Fetch agent commissions
      const agentsResponse = await pyFetch('/api/admin/agents/commissions', {
        method: 'GET',
        headers: {
          'X-API-Key': import.meta.env.VITE_PY_API_KEY || 'your-api-key'
        }
      });
      
      if (agentsResponse.success) {
        setAgentCommissions(agentsResponse.commissions || []);
      }
      
    } catch (error) {
      console.error('Error fetching commission data:', error);
      toast.error('Failed to fetch commission data');
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-semibold text-gray-800">Commission Overview</h2>
        <button
          onClick={fetchCommissionData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Agents</p>
                <p className="text-2xl font-bold">{summary.totalAgents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Commission</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalCommission)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Paid Commission</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.paidCommission)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-yellow-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Pending Commission</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.pendingCommission)}</p>
              </div>
              <Clock className="h-8 w-8 text-red-200" />
            </div>
          </div>
        </div>
      )}

      {/* Additional Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Commission Rate</p>
                <p className="text-xl font-semibold text-gray-800">{(summary.averageCommissionRate * 100).toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Commission</p>
                <p className="text-xl font-semibold text-gray-800">{formatCurrency(summary.monthlyCommission)}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Top Performer</p>
                <p className="text-lg font-semibold text-gray-800 truncate">{summary.topPerformingAgent}</p>
              </div>
              <PieChart className="h-6 w-6 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Agent Commission Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Agent Commission Summary</h3>
        </div>
        
        {agentCommissions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No agent commission data available
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
                    Commission Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentCommissions.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(agent.commissionRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.totalBookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(agent.totalCommission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(agent.paidCommission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                      {formatCurrency(agent.pendingCommission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        agent.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : agent.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionOverview;
