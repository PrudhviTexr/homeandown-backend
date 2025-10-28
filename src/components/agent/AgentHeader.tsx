import React from 'react';
import { Menu, User, LogOut, RefreshCw } from 'lucide-react';
import NotificationPanel from '@/components/agent/NotificationPanel';

interface AgentHeaderProps {
  user: any;
  agentProfile: any;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  onSignOut: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({
  user,
  agentProfile,
  // sidebarCollapsed,
  onSidebarToggle,
  onSignOut,
  onRefresh,
  loading = false
}) => {
  return (
    <header className="bg-[#3B5998] text-white p-4 flex items-center justify-between no-print">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <button
            onClick={onSidebarToggle}
            className="p-2 hover:bg-blue-700 rounded"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-semibold ml-2">Agent Dashboard</h2>
        </div>  
      </div>

      <div className="flex items-center space-x-4">
        <NotificationPanel />
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 hover:bg-blue-700 rounded disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-[#3B5998]" />
          </div>
          <div className="hidden md:block">
            <div className="font-medium text-sm">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-blue-200">License: {agentProfile?.agent_license_number || 'N/A'}</div>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 hover:bg-blue-700 rounded"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AgentHeader;