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
    
    // Load dashboard immediately without waiting for data
    setLoading(false);
    
    // Fetch data asynchronously in background
    if (!dataLoaded) {
      Promise.all([
        fetchAgentDashboard(),
        fetchAgentProfile()
      ]).finally(() => {
        setDataLoaded(true);
      });
    }
  }, [user, navigate, dataLoaded]);

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

    // If data is already loaded and not forcing refresh, skip
    if (dashboardStats && !forceRefresh) {
      return;
    }

    setLoading(true);
    try {
      console.log('[AgentDashboard] Fetching dashboard data for agent:', user.id);
      
      // Use the proper AgentApi to fetch agent-specific data
      const [statsResponse, inquiriesResponse, bookingsResponse, propertiesResponse] = await Promise.allSettled([
        AgentApi.getDashboardStats(),
        AgentApi.getInquiries(),
        AgentApi.getBookings(),
        AgentApi.getProperties()
      ]);
      
      let stats: any = {};
      let inquiries: any[] = [];
      let bookings: any[] = [];
      let properties: any[] = [];
      
      if (statsResponse.status === 'fulfilled') {
        stats = statsResponse.value.stats || {};
        console.log('[AgentDashboard] Stats fetched:', stats);
      } else {
        console.error('[AgentDashboard] Error fetching stats:', statsResponse.reason);
      }
      
      if (inquiriesResponse.status === 'fulfilled') {
        inquiries = inquiriesResponse.value.inquiries || [];
        console.log('[AgentDashboard] Inquiries fetched:', inquiries.length);
      } else {
        console.error('[AgentDashboard] Error fetching inquiries:', inquiriesResponse.reason);
      }
      
      if (bookingsResponse.status === 'fulfilled') {
        bookings = bookingsResponse.value.bookings || [];
        console.log('[AgentDashboard] Bookings fetched:', bookings.length);
      } else {
        console.error('[AgentDashboard] Error fetching bookings:', bookingsResponse.reason);
      }
      
      if (propertiesResponse.status === 'fulfilled') {
        properties = propertiesResponse.value.properties || [];
        console.log('[AgentDashboard] Properties fetched:', properties.length);
      } else {
        console.error('[AgentDashboard] Error fetching properties:', propertiesResponse.reason);
      }
      
      // Use the stats from the API response or calculate from individual data
      const dashboardStatsData: AgentDashboardStats = {
        totalAssignments: stats.total_properties || properties.length,
        totalInquiries: stats.total_inquiries || inquiries.length,
        totalBookings: stats.total_bookings || bookings.length,
        acceptedAssignments: stats.active_properties || properties.filter(p => p.status === 'active').length,
        totalEarnings: (stats.active_properties || 0) * 15000,
        monthlyCommission: ((stats.active_properties || 0) * 15000) / 12,
        performance: {
          conversionRate: stats.conversion_rate || 0,
          responseTime: '< 2 hours',
          customerRating: 4.8,
          activeAssignments: stats.pending_properties || properties.filter(p => p.status === 'pending').length
        },
        recentContacts: [...inquiries.slice(0, 5), ...bookings.slice(0, 5)],
        todayContacts: [...inquiries.filter(inq => String(inq.created_at).startsWith(new Date().toISOString().split('T')[0])), 
                       ...bookings.filter(b => String(b.created_at).startsWith(new Date().toISOString().split('T')[0]))]
      };
      
      setDashboardStats(dashboardStatsData);
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
    setDataLoaded(false);
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
        return <FastDashboard user={user} agentProfile={agentProfile} key={refreshTrigger} />;

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