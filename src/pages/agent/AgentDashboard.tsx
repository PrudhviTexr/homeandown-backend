import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AgentApi, RecordsApi } from '@/services/pyApi';
import { pyFetch } from '@/utils/backend';
import AgentSidebar from '@/components/agent/AgentSidebar';
import AgentHeader from '@/components/agent/AgentHeader';
import PasswordChangeModal from '@/components/PasswordChangeModal';

// Import separate component pages
import FastDashboard from './components/FastDashboard';
import Settings from './components/Settings';
import Performance from './components/Performance';
import Earnings from './components/Earnings';
import Activity from './components/Activity';
import Help from './components/Help';
import AgentBookings from './components/AgentBookings';
import AgentInquiries from './components/AgentInquiries'; 

interface AgentDashboardStats {
  totalAssignments: number;
  totalInquiries: number;
  totalBookings: number;
  acceptedAssignments: number;
  totalEarnings: number;
  monthlyCommission: number;
  performance: {
    conversionRate: number;
    responseTime: string;
    customerRating: number;
    activeAssignments: number;
  };
  recentContacts: any[];
  todayContacts: any[];
}

const AgentDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [dashboardStats, setDashboardStats] = useState<AgentDashboardStats | null>(null);
  const [loading, setLoading] = useState(false); // Start with false for faster loading
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [agentProfile, setAgentProfile] = useState<any>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!user || (user as any).user_type !== 'agent') {
      // Redirect with a slight delay to allow for state updates
      setTimeout(() => {
        navigate('/');
      }, 100);
      return;
    }
    
    // Fetch data immediately on mount
    fetchAgentDashboard(true);
    fetchAgentProfile();
    
    // Set up auto-refresh every 30 seconds for real-time data
    const interval = setInterval(() => {
      console.log('[AgentDashboard] Auto-refreshing dashboard data...');
      fetchAgentDashboard(true);
      fetchAgentProfile();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchAgentProfile = async () => {
    if (!user) return;
    
    try {
      // Use the auth/me endpoint to get current user profile
      const profile = await pyFetch('/api/auth/me', { method: 'GET', useApiKey: false });
      if (profile) setAgentProfile(profile);
    } catch (error) {
      console.error('Error fetching agent profile:', error);
      setAgentProfile({ ...user });
    }
  };

  const fetchAgentDashboard = async (forceRefresh = false) => {
    if (!user || (user as any).user_type !== 'agent') return;

    setLoading(true);
    try {
      console.log('[AgentDashboard] Fetching dashboard data for agent:', user.id, forceRefresh ? '(force refresh)' : '');
      
      // Use the proper AgentApi to fetch agent-specific data
      const [statsResponse, inquiriesResponse, bookingsResponse, propertiesResponse] = await Promise.allSettled([
        AgentApi.getDashboardStats(),
        AgentApi.getInquiries(undefined, undefined, 50),
        AgentApi.getBookings(undefined, undefined, 50),
        AgentApi.getProperties(undefined, 50)
      ]);
      
      let stats: any = {};
      let inquiries: any[] = [];
      let bookings: any[] = [];
      let properties: any[] = [];
      
      if (statsResponse.status === 'fulfilled') {
        const statsValue = statsResponse.value;
        console.log('[AgentDashboard] Stats API response:', statsValue);
        stats = statsValue?.stats || statsValue || {};
        console.log('[AgentDashboard] Stats extracted:', stats);
      } else {
        console.error('[AgentDashboard] Error fetching stats:', statsResponse.reason);
        console.error('[AgentDashboard] Stats error details:', statsResponse.reason?.message || statsResponse.reason);
      }
      
      if (inquiriesResponse.status === 'fulfilled') {
        const inquiriesValue = inquiriesResponse.value;
        console.log('[AgentDashboard] Inquiries API response:', inquiriesValue);
        inquiries = inquiriesValue?.inquiries || (Array.isArray(inquiriesValue) ? inquiriesValue : []);
        console.log('[AgentDashboard] Inquiries extracted:', inquiries.length);
      } else {
        console.error('[AgentDashboard] Error fetching inquiries:', inquiriesResponse.reason);
        console.error('[AgentDashboard] Inquiries error details:', inquiriesResponse.reason?.message || inquiriesResponse.reason);
      }
      
      if (bookingsResponse.status === 'fulfilled') {
        const bookingsValue = bookingsResponse.value;
        console.log('[AgentDashboard] Bookings API response:', bookingsValue);
        bookings = bookingsValue?.bookings || (Array.isArray(bookingsValue) ? bookingsValue : []);
        console.log('[AgentDashboard] Bookings extracted:', bookings.length);
      } else {
        console.error('[AgentDashboard] Error fetching bookings:', bookingsResponse.reason);
        console.error('[AgentDashboard] Bookings error details:', bookingsResponse.reason?.message || bookingsResponse.reason);
      }
      
      if (propertiesResponse.status === 'fulfilled') {
        const propertiesValue = propertiesResponse.value;
        console.log('[AgentDashboard] Properties API response:', propertiesValue);
        properties = propertiesValue?.properties || (Array.isArray(propertiesValue) ? propertiesValue : []);
        console.log('[AgentDashboard] Properties extracted:', properties.length);
      } else {
        console.error('[AgentDashboard] Error fetching properties:', propertiesResponse.reason);
        console.error('[AgentDashboard] Properties error details:', propertiesResponse.reason?.message || propertiesResponse.reason);
      }
      
      // Use the stats from the API response or calculate from individual data
      const dashboardStatsData: AgentDashboardStats = {
        totalAssignments: stats.total_properties || properties.length || 0,
        totalInquiries: stats.total_inquiries || inquiries.length || 0,
        totalBookings: stats.total_bookings || bookings.length || 0,
        acceptedAssignments: stats.active_properties || properties.filter((p: any) => p.status === 'active').length || 0,
        totalEarnings: stats.total_earnings || (stats.active_properties || 0) * 15000 || 0,
        monthlyCommission: stats.monthly_commission || ((stats.active_properties || 0) * 15000) / 12 || 0,
        performance: {
          conversionRate: stats.conversion_rate || (inquiries.length > 0 ? (bookings.length / inquiries.length) * 100 : 0) || 0,
          responseTime: stats.avg_response_time || '< 2 hours',
          customerRating: stats.customer_rating || 4.8,
          activeAssignments: stats.pending_properties || properties.filter((p: any) => p.status === 'pending').length || 0
        },
        recentContacts: [...inquiries.slice(0, 5), ...bookings.slice(0, 5)],
        todayContacts: [
          ...inquiries.filter((inq: any) => {
            const created = inq.created_at || inq.createdAt;
            return created && String(created).startsWith(new Date().toISOString().split('T')[0]);
          }), 
          ...bookings.filter((b: any) => {
            const created = b.created_at || b.createdAt;
            return created && String(created).startsWith(new Date().toISOString().split('T')[0]);
          })
        ]
      };
      
      console.log('[AgentDashboard] Dashboard stats updated:', dashboardStatsData);
      setDashboardStats(dashboardStatsData);
      setDataLoaded(true);
    } catch (error) {
      console.error('[AgentDashboard] Error fetching agent dashboard:', error);
      // Default empty data
      setDashboardStats({
        totalAssignments: 0,
        totalInquiries: 0,
        totalBookings: 0,
        acceptedAssignments: 0,
        totalEarnings: 0,
        monthlyCommission: 0,
        performance: {
          conversionRate: 0,
          responseTime: '< 2 hours',
          customerRating: 4.5,
          activeAssignments: 0
        },
        recentContacts: [],
        todayContacts: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRefresh = () => {
    console.log('[AgentDashboard] Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
    fetchAgentDashboard(true);
    fetchAgentProfile();
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <FastDashboard user={user} agentProfile={agentProfile} key={`dashboard-${refreshTrigger}-${Date.now()}`} />;

      case 'bookings':
        return <AgentBookings key={refreshTrigger} />;

      case 'inquiries':
        return <AgentInquiries key={refreshTrigger} />;

      case 'performance':
        return <Performance dashboardStats={dashboardStats} key={refreshTrigger} />;

      case 'earnings':
        return <Earnings dashboardStats={dashboardStats} key={refreshTrigger} />;

      case 'activity':
        return <Activity dashboardStats={dashboardStats} key={refreshTrigger} />;

      case 'settings':
        return (
          <Settings 
            user={user}
            agentProfile={agentProfile}
            setAgentProfile={setAgentProfile}
            setShowPasswordModal={setShowPasswordModal}
          />
        );

      case 'help':
        return <Help key={refreshTrigger} />;

      default:
        return (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-[#90C641] text-white px-4 py-2 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <AgentSidebar
        sidebarCollapsed={sidebarCollapsed}
        activeTab={activeTab}
        expandedMenus={expandedMenus}
        onTabChange={setActiveTab}
        onMenuToggle={toggleMenu}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AgentHeader
          user={user}
          agentProfile={agentProfile}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSignOut={handleSignOut}
          onRefresh={handleRefresh}
          loading={loading}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-[#3B5998] text-white text-center py-4">
          <p className="text-sm">© Home & Own 2025. All Rights Reserved</p>
        </footer>
      </div>
      
      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeModal
          isOpen={true}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
};

export default AgentDashboard;