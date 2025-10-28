import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Users, TrendingUp, Settings, Edit, Save, X, 
  Plus, Filter, Search, Calendar, BarChart3, PieChart,
  CheckCircle, AlertCircle, Clock, Eye, MoreVertical
} from 'lucide-react';
import { getApiUrl } from '@/utils/backend';
import { formatIndianCurrency } from '@/utils/currency';

interface CommissionTrackingProps {
  isAdmin?: boolean;
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

interface CommissionPayment {
  id: string;
  bookingId: string;
  agentId: string;
  agentName: string;
  propertyTitle: string;
  commissionAmount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string;
  status: 'paid' | 'pending' | 'failed';
}

interface CommissionSummary {
  totalAgents: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  averageCommissionRate: number;
  topPerformingAgent: string;
  monthlyCommission: number;
}

const CommissionTracking: React.FC<CommissionTrackingProps> = ({ isAdmin = false }) => {
  const [agents, setAgents] = useState<AgentCommission[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [summary, setSummary] = useState<CommissionSummary>({
    totalAgents: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    averageCommissionRate: 0,
    topPerformingAgent: '',
    monthlyCommission: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'payments' | 'settings'>('overview');
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      // Fetch commission summary
      try {
        const summaryResponse = await fetch(getApiUrl('/api/admin/commissions/summary'), { headers });
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        }
      } catch (error) {
        console.log('Commission summary endpoint not available, calculating manually');
        await calculateCommissionSummary();
      }

      // Fetch agents with commission data
      await fetchAgentsWithCommissions();

      // Fetch commission payments
      await fetchCommissionPayments();

    } catch (error) {
      console.error('Error fetching commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCommissionSummary = async () => {
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      // Fetch users (agents)
      const usersResponse = await fetch(getApiUrl('/api/admin/users'), { headers });
      const users = usersResponse.ok ? await usersResponse.json() : [];
      const agents = users.filter((user: any) => user.user_type === 'agent');

      // Fetch bookings
      const bookingsResponse = await fetch(getApiUrl('/api/admin/bookings'), { headers });
      const bookings = bookingsResponse.ok ? await bookingsResponse.json() : [];

      let totalCommission = 0;
      let paidCommission = 0;
      let pendingCommission = 0;
      let totalCommissionRate = 0;
      let topAgent = '';
      let topAgentCommission = 0;

      agents.forEach((agent: any) => {
        const agentBookings = bookings.filter((booking: any) => booking.agent_id === agent.id);
        const agentCommission = agentBookings.reduce((total: number, booking: any) => {
          const rate = booking.commission_rate || 0.02;
          const price = booking.property_price || 0;
          return total + (price * rate);
        }, 0);

        totalCommission += agentCommission;
        totalCommissionRate += agent.commission_rate || 0.02;

        if (agentCommission > topAgentCommission) {
          topAgentCommission = agentCommission;
          topAgent = `${agent.first_name} ${agent.last_name}`;
        }
      });

      setSummary({
        totalAgents: agents.length,
        totalCommission,
        paidCommission: paidCommission, // Would need payment tracking
        pendingCommission: totalCommission - paidCommission,
        averageCommissionRate: agents.length > 0 ? totalCommissionRate / agents.length : 0,
        topPerformingAgent: topAgent,
        monthlyCommission: totalCommission // Simplified - would need date filtering
      });

    } catch (error) {
      console.error('Error calculating commission summary:', error);
    }
  };

  const fetchAgentsWithCommissions = async () => {
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      // Fetch users (agents)
      const usersResponse = await fetch(getApiUrl('/api/admin/users'), { headers });
      const users = usersResponse.ok ? await usersResponse.json() : [];
      const agents = users.filter((user: any) => user.user_type === 'agent');

      // Fetch bookings
      const bookingsResponse = await fetch(getApiUrl('/api/admin/bookings'), { headers });
      const bookings = bookingsResponse.ok ? await bookingsResponse.json() : [];

      const agentsWithCommissions = agents.map((agent: any) => {
        const agentBookings = bookings.filter((booking: any) => booking.agent_id === agent.id);
        const totalCommission = agentBookings.reduce((total: number, booking: any) => {
          const rate = booking.commission_rate || 0.02;
          const price = booking.property_price || 0;
          return total + (price * rate);
        }, 0);

        return {
          agentId: agent.id,
          agentName: `${agent.first_name} ${agent.last_name}`,
          licenseNumber: agent.license_number || agent.agent_license_number || 'N/A',
          email: agent.email,
          phone: agent.phone_number || '',
          commissionRate: agent.commission_rate || 0.02,
          totalBookings: agentBookings.length,
          totalCommission,
          paidCommission: 0, // Would need payment tracking
          pendingCommission: totalCommission,
          lastPaymentDate: agentBookings.length > 0 ? agentBookings[0].created_at : '',
          status: agent.status || 'active'
        };
      });

      setAgents(agentsWithCommissions);

    } catch (error) {
      console.error('Error fetching agents with commissions:', error);
    }
  };

  const fetchCommissionPayments = async () => {
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      // For now, create mock payment data since commission_payments table doesn't exist yet
      const mockPayments: CommissionPayment[] = [
        {
          id: '1',
          bookingId: 'booking-1',
          agentId: 'agent-1',
          agentName: 'John Agent',
          propertyTitle: 'Luxury Villa in Jubilee Hills',
          commissionAmount: 100000,
          paymentDate: '2025-10-20',
          paymentMethod: 'Bank Transfer',
          paymentReference: 'TXN123456',
          status: 'paid'
        },
        {
          id: '2',
          bookingId: 'booking-2',
          agentId: 'agent-2',
          agentName: 'Jane Agent',
          propertyTitle: 'Modern Apartment in Gachibowli',
          commissionAmount: 50000,
          paymentDate: '2025-10-21',
          paymentMethod: 'UPI',
          paymentReference: 'UPI789012',
          status: 'pending'
        }
      ];

      setPayments(mockPayments);

    } catch (error) {
      console.error('Error fetching commission payments:', error);
    }
  };

  const handleUpdateCommissionRate = async (agentId: string) => {
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      
      const response = await fetch(getApiUrl(`/api/admin/agents/${agentId}/commission/set-rate`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          commission_rate: newCommissionRate
        })
      });

      if (response.ok) {
        // Update local state
        setAgents(agents.map(agent => 
          agent.agentId === agentId 
            ? { ...agent, commissionRate: newCommissionRate }
            : agent
        ));
        setEditingAgent(null);
        setNewCommissionRate(0);
      }
    } catch (error) {
      console.error('Error updating commission rate:', error);
    }
  };

  const handlePayCommission = async (paymentId: string) => {
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      
      const response = await fetch(getApiUrl(`/api/admin/bookings/${paymentId}/commission/pay`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          payment_amount: 0, // Would be calculated
          payment_method: 'Bank Transfer'
        })
      });

      if (response.ok) {
        // Refresh payments
        fetchCommissionPayments();
      }
    } catch (error) {
      console.error('Error paying commission:', error);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    const matchesSearch = agent.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesSearch = payment.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Tracking</h1>
          <p className="text-gray-600">Manage agent commissions and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCommissionData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'agents', label: 'Agent Commissions', icon: Users },
            { id: 'payments', label: 'Payments', icon: DollarSign },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalAgents}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Commission</p>
                  <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(summary.totalCommission)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid Commission</p>
                  <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(summary.paidCommission)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Commission</p>
                  <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(summary.pendingCommission)}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Rates</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Rate</span>
                  <span className="text-sm font-semibold text-gray-900">{(summary.averageCommissionRate * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${summary.averageCommissionRate * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performer</h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{summary.topPerformingAgent}</div>
                <div className="text-sm text-gray-600">Highest Commission Earner</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Agents Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAgents.map((agent) => (
                    <tr key={agent.agentId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                          <div className="text-sm text-gray-500">{agent.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.licenseNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAgent === agent.agentId ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              value={newCommissionRate}
                              onChange={(e) => setNewCommissionRate(parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <button
                              onClick={() => handleUpdateCommissionRate(agent.agentId)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingAgent(null)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{(agent.commissionRate * 100).toFixed(1)}%</span>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setEditingAgent(agent.agentId);
                                  setNewCommissionRate(agent.commissionRate);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.totalBookings}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatIndianCurrency(agent.totalCommission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          agent.status === 'active' ? 'bg-green-100 text-green-800' :
                          agent.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.agentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.propertyTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatIndianCurrency(payment.commissionAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {payment.status === 'pending' && isAdmin && (
                          <button
                            onClick={() => handlePayCommission(payment.bookingId)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && isAdmin && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Commission Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.02"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="ml-2 text-sm text-gray-500">(2% = 0.02)</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Processing Fee
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="ml-2 text-sm text-gray-500">(Fixed amount)</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Payment Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  defaultValue="10000"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="ml-2 text-sm text-gray-500">(Minimum amount for auto-payment)</span>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionTracking;