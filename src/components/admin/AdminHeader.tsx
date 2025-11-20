import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

interface AdminHeaderProps {
  user: any;
  isRefreshing?: boolean;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  onSignOut: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  user,
  isRefreshing = false,
  // sidebarCollapsed,
  onSidebarToggle,
  onSignOut
}) => {
  return (
    <header className="bg-[#3B5998] text-white p-3 sm:p-4 flex items-center justify-between no-print shadow-md">
      <div className="flex items-center">
        <button
          onClick={onSidebarToggle}
          className="p-2 hover:bg-blue-700 rounded transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="ml-3 text-lg sm:text-xl font-semibold hidden sm:block">Admin Dashboard</h1>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {isRefreshing && (
          <div className="flex items-center">
            <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
            <span className="text-xs sm:text-sm hidden sm:inline">Refreshing data...</span>
          </div>
        )}
        <NotificationPanel />
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#3B5998]" />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-medium">{user?.first_name} {user?.last_name}</span>
            <div className="text-xs text-blue-200">Administrator</div>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 hover:bg-blue-700 rounded transition-colors"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;