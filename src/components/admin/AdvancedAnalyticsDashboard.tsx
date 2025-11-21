import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Download, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { AnalyticsApi } from '@/services/pyApi';
import toast from 'react-hot-toast';

interface TrendData {
  date: string;
  users?: number;
  properties?: number;
  bookings?: number;
  inquiries?: number;
}

interface ConversionFunnel {
  properties: number;
  inquiries: number;
  bookings: number;
}

interface RevenueAnalytics {
  total_sale_value: number;
  total_rent_value: number;
  average_sale_price: number;
  average_rent: number;
  sale_properties_count: number;
  rent_properties_count: number;
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [conversionRates, setConversionRates] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [trendsData, funnelData, revenueData] = await Promise.all([
        AnalyticsApi.getTrends(timeRange, 'all').catch(() => null),
        AnalyticsApi.getConversionFunnel(timeRange).catch(() => null),
        AnalyticsApi.getRevenueAnalytics(timeRange).catch(() => null)
      ]);

      if (trendsData?.trends) {
        setTrends(trendsData.trends);
      }

      if (funnelData?.funnel) {
        setFunnel(funnelData.funnel);
        setConversionRates(funnelData.conversion_rates);
      }

      if (revenueData?.revenue) {
        setRevenue(revenueData.revenue);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType: string) => {
    try {
      const csvData = await AnalyticsApi.exportCSV(reportType, timeRange);
      
      // Create and download CSV file
      const blob = new Blob([csvData.content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = csvData.filename || `report_${reportType}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return '₹0.00';
    // Format with Indian numbering system (commas) with 2 decimal places
    return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const maxValue = trends.length > 0 ? Math.max(
    ...trends.map(t => Math.max(
      t.users || 0,
      t.properties || 0,
      t.bookings || 0,
      t.inquiries || 0
    ))
  ) : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Comprehensive analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={() => exportReport('all')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {trends.reduce((sum, t) => sum + (t.users || 0), 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">
                {trends.reduce((sum, t) => sum + (t.properties || 0), 0)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {trends.reduce((sum, t) => sum + (t.bookings || 0), 0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">
                {trends.reduce((sum, t) => sum + (t.inquiries || 0), 0)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends</h3>
        <div className="h-64 flex items-end gap-2">
          {trends.map((trend, index) => {
            const date = new Date(trend.date);
            const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-0.5 h-48">
                  <div
                    className="bg-blue-500 rounded-t w-full"
                    style={{
                      height: `${((trend.users || 0) / maxValue) * 100}%`,
                      minHeight: trend.users ? '4px' : '0'
                    }}
                    title={`Users: ${trend.users || 0}`}
                  />
                  <div
                    className="bg-green-500 rounded-t w-full"
                    style={{
                      height: `${((trend.properties || 0) / maxValue) * 100}%`,
                      minHeight: trend.properties ? '4px' : '0'
                    }}
                    title={`Properties: ${trend.properties || 0}`}
                  />
                  <div
                    className="bg-yellow-500 rounded-t w-full"
                    style={{
                      height: `${((trend.bookings || 0) / maxValue) * 100}%`,
                      minHeight: trend.bookings ? '4px' : '0'
                    }}
                    title={`Bookings: ${trend.bookings || 0}`}
                  />
                  <div
                    className="bg-purple-500 rounded-t w-full"
                    style={{
                      height: `${((trend.inquiries || 0) / maxValue) * 100}%`,
                      minHeight: trend.inquiries ? '4px' : '0'
                    }}
                    title={`Inquiries: ${trend.inquiries || 0}`}
                  />
                </div>
                <span className="text-xs text-gray-600 transform -rotate-45 origin-top-left whitespace-nowrap">
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Properties</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-600">Inquiries</span>
          </div>
        </div>
      </div>

      {/* Conversion Funnel & Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          {funnel && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Properties</span>
                  <span className="font-semibold">{funnel.properties}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Inquiries</span>
                  <span className="font-semibold">{funnel.inquiries}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{
                      width: `${conversionRates?.properties_to_inquiries || 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  Conversion: {conversionRates?.properties_to_inquiries || 0}%
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bookings</span>
                  <span className="font-semibold">{funnel.bookings}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-500 h-3 rounded-full"
                    style={{
                      width: `${conversionRates?.inquiries_to_bookings || 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  Conversion: {conversionRates?.inquiries_to_bookings || 0}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Revenue Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Analytics
          </h3>
          {revenue && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Sale Value</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(revenue.total_sale_value)}
                </p>
                <p className="text-xs text-gray-500">
                  {revenue.sale_properties_count} properties
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Rent Value</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(revenue.total_rent_value)}
                </p>
                <p className="text-xs text-gray-500">
                  {revenue.rent_properties_count} properties
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-600">Avg Sale Price</p>
                  <p className="text-lg font-semibold">{formatCurrency(revenue.average_sale_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Avg Rent</p>
                  <p className="text-lg font-semibold">{formatCurrency(revenue.average_rent)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => exportReport('users')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Users
          </button>
          <button
            onClick={() => exportReport('properties')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Properties
          </button>
          <button
            onClick={() => exportReport('bookings')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Bookings
          </button>
          <button
            onClick={() => exportReport('inquiries')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Inquiries
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
