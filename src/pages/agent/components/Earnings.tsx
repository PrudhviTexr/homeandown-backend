import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Calendar, BarChart3, PieChart,
  Download, Filter, RefreshCw, Eye, Clock, CheckCircle,
  AlertCircle, Target, Award, Users, Home
} from 'lucide-react';
import { getApiUrl } from '@/utils/backend';
import { formatIndianCurrency } from '@/utils/currency';

interface EarningsProps {
  agentId?: string;
  isAdmin?: boolean;
}

interface CommissionData {
  id: string;
  bookingId: string;
  propertyTitle: string;
  propertyPrice: number;
  commissionRate: number;
  commissionAmount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string;
  status: 'paid' | 'pending' | 'failed';
  clientName: string;
  clientEmail: string;
}

interface EarningsSummary {
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  monthlyEarnings: number;
  totalBookings: number;
  averageCommissionRate: number;
  topPerformingMonth: string;
  recentPayments: CommissionData[];
}

const Earnings: React.FC<EarningsProps> = ({ agentId, isAdmin = false }) => {
  const [earnings, setEarnings] = useState<CommissionData[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    paidEarnings: 0,
    pendingEarnings: 0,
    monthlyEarnings: 0,
    totalBookings: 0,
    averageCommissionRate: 0,
    topPerformingMonth: '',
    recentPayments: []
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics'>('overview');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchEarningsData();
  }, [agentId, filterPeriod]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      // Fetch agent commissions
      if (agentId) {
        try {
          const response = await fetch(getApiUrl(`/api/admin/agents/${agentId}/commissions`), { headers });
          if (response.ok) {
            const data = await response.json();
            setEarnings(data.commissions || []);
            setSummary(data.summary || calculateSummary(data.commissions || []));
            return;
          }
        } catch (error) {
          console.log('Agent commissions endpoint not available, calculating manually');
        }
      }

      // Fallback: Calculate from bookings
      await calculateEarningsFromBookings();

    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarningsFromBookings = async () => {
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      // Fetch bookings
      const bookingsResponse = await fetch(getApiUrl('/api/admin/bookings'), { headers });
      if (bookingsResponse.ok) {
        const bookings = await bookingsResponse.json();
        const agentBookings = agentId 
          ? bookings.filter((booking: any) => booking.agent_id === agentId)
          : bookings;

        const commissionData = agentBookings.map((booking: any) => ({
          id: booking.id,
          bookingId: booking.id,
          propertyTitle: booking.property_title || 'Property',
          propertyPrice: booking.property_price || 0,
          commissionRate: booking.commission_rate || 0.02,
          commissionAmount: (booking.property_price || 0) * (booking.commission_rate || 0.02),
          paymentDate: booking.created_at,
          paymentMethod: 'Bank Transfer', // Default
          paymentReference: `TXN${booking.id.slice(-6)}`,
          status: 'pending' as const, // Default status
          clientName: booking.client_name || 'Client',
          clientEmail: booking.client_email || ''
        }));

        setEarnings(commissionData);
        setSummary(calculateSummary(commissionData));
      }
    } catch (error) {
      console.error('Error calculating earnings from bookings:', error);
    }
  };

  const calculateSummary = (earningsData: CommissionData[]): EarningsSummary => {
    const totalEarnings = earningsData.reduce((sum, earning) => sum + earning.commissionAmount, 0);
    const paidEarnings = earningsData
      .filter(earning => earning.status === 'paid')
      .reduce((sum, earning) => sum + earning.commissionAmount, 0);
    const pendingEarnings = totalEarnings - paidEarnings;
    
    // Calculate monthly earnings (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyEarnings = earningsData
      .filter(earning => {
        const earningDate = new Date(earning.paymentDate);
        return earningDate.getMonth() === currentMonth && earningDate.getFullYear() === currentYear;
      })
      .reduce((sum, earning) => sum + earning.commissionAmount, 0);

    const averageCommissionRate = earningsData.length > 0 
      ? earningsData.reduce((sum, earning) => sum + earning.commissionRate, 0) / earningsData.length
      : 0;

    // Find top performing month
    const monthlyTotals: { [key: string]: number } = {};
    earningsData.forEach(earning => {
      const date = new Date(earning.paymentDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + earning.commissionAmount;
    });

    const topMonth = Object.entries(monthlyTotals).reduce((max, [month, amount]) => 
      amount > max.amount ? { month, amount } : max, 
      { month: '', amount: 0 }
    );

    return {
      totalEarnings,
      paidEarnings,
      pendingEarnings,
      monthlyEarnings,
      totalBookings: earningsData.length,
      averageCommissionRate,
      topPerformingMonth: topMonth.month,
      recentPayments: earningsData.slice(0, 5)
    };
  };

  const filteredEarnings = earnings.filter(earning => {
    const matchesStatus = filterStatus === 'all' || earning.status === filterStatus;
    
    let matchesPeriod = true;
    if (filterPeriod !== 'all') {
      const earningDate = new Date(earning.paymentDate);
      const now = new Date();
      
      switch (filterPeriod) {
        case 'this_month':
          matchesPeriod = earningDate.getMonth() === now.getMonth() && 
                         earningDate.getFullYear() === now.getFullYear();
          break;
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          matchesPeriod = earningDate.getMonth() === lastMonth.getMonth() && 
                         earningDate.getFullYear() === lastMonth.getFullYear();
          break;
        case 'this_year':
          matchesPeriod = earningDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    
    return matchesStatus && matchesPeriod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings & Commissions</h1>
          <p className="text-gray-600">Track your commission earnings and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEarningsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'transactions', label: 'Transactions', icon: DollarSign },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
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
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(summary.totalEarnings)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(summary.paidEarnings)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(summary.pendingEarnings)}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(summary.monthlyEarnings)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
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
                  <span className="text-sm text-gray-600">Total Bookings</span>
                  <span className="text-sm font-semibold text-gray-900">{summary.totalBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Commission Rate</span>
                  <span className="text-sm font-semibold text-gray-900">{(summary.averageCommissionRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment Success Rate</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {summary.totalEarnings > 0 ? Math.round((summary.paidEarnings / summary.totalEarnings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
              <div className="space-y-3">
                {summary.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.propertyTitle}</p>
                      <p className="text-xs text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatIndianCurrency(payment.commissionAmount)}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                </select>
              </div>
              <div>
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
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEarnings.map((earning) => (
                    <tr key={earning.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{earning.propertyTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{earning.clientName}</div>
                          <div className="text-sm text-gray-500">{earning.clientEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatIndianCurrency(earning.propertyPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(earning.commissionRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatIndianCurrency(earning.commissionAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(earning.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(earning.status)}`}>
                          {getStatusIcon(earning.status)}
                          {earning.status}
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

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Trend</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Chart visualization would go here</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Breakdown</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Pie chart visualization would go here</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.totalBookings}</div>
                <div className="text-sm text-gray-600">Total Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatIndianCurrency(summary.totalEarnings)}</div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{(summary.averageCommissionRate * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Avg Commission Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings;