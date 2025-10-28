import React from 'react';
import { 
  Home,
  Users,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  BarChart3,
  MapPin,
  UserCheck,
  FileText,
  Shield,
  DollarSign,
  UserCog,
  Bell
} from 'lucide-react';
import { MenuItem } from '@/types/admin';

interface AdminSidebarProps {
  sidebarCollapsed: boolean;
  activeTab: string;
  expandedMenus: string[];
  onTabChange: (tab: string) => void;
  onMenuToggle: (menuId: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  sidebarCollapsed,
  activeTab,
  expandedMenus,
  onTabChange,
  onMenuToggle
}) => {
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: 'dashboard'
    },
    {
      id: 'enhanced-dashboard',
      label: 'Enhanced Dashboard',
      icon: BarChart3,
      path: 'enhanced-dashboard'
    },
    {
      id: 'manage-users',
      label: 'Manage Users',
      icon: Users,
      children: [
        { id: 'users', label: 'All Users', path: 'users', icon: Users },
        { id: 'buyers', label: 'Buyers', path: 'buyers', icon: Users },
        { id: 'sellers', label: 'Sellers', path: 'sellers', icon: Users },
        { id: 'agents', label: 'Agents', path: 'agents', icon: Users }
      ]
    },
    {
      id: 'tour-management',
      label: 'Tour Management',
      icon: Calendar,
      children: [
        { id: 'bookings', label: 'All Tours', path: 'bookings', icon: Calendar },
        { id: 'pending-tours', label: 'Pending Tours', path: 'pending-tours', icon: Calendar },
        { id: 'confirmed-tours', label: 'Confirmed Tours', path: 'confirmed-tours', icon: Calendar },
        { id: 'completed-tours', label: 'Completed Tours', path: 'completed-tours', icon: Calendar }
      ]
    },
    {
      id: 'listing-management',
      label: 'Listing Management',
      icon: Building2,
      children: [
        { id: 'properties', label: 'All Properties', path: 'properties', icon: Building2 },
        { id: 'properties-sale', label: 'For Sale', path: 'properties-sale', icon: Building2 },
        { id: 'properties-rent', label: 'For Rent', path: 'properties-rent', icon: Building2 },
        { id: 'apartments', label: 'Apartments', path: 'apartments', icon: Building2 },
        { id: 'houses', label: 'Houses', path: 'houses', icon: Building2 },
        { id: 'commercial', label: 'Commercial', path: 'commercial', icon: Building2 },
        { id: 'land', label: 'Land/Plots', path: 'land', icon: Building2 },
        { id: 'inquiries', label: 'Inquiries', path: 'inquiries', icon: Building2 }
      ]
    },
    {
      id: 'location-management',
      label: 'Location Management',
      icon: MapPin,
      children: [
        { id: 'cities', label: 'Cities', path: 'cities', icon: MapPin },
        { id: 'states', label: 'States', path: 'states', icon: MapPin }
      ]
    },
    {
      id: 'user-approvals',
      label: 'User Approvals',
      icon: UserCheck,
      path: 'user-approvals'
    },
    {
      id: 'property-approvals',
      label: 'Property Approvals',
      icon: Building2,
      path: 'property-approvals'
    },
    {
      id: 'property-assignments',
      label: 'Property Assignments',
      icon: Building2,
      path: 'property-assignments'
    },
        {
          id: 'document-viewer',
          label: 'Document Viewer',
          icon: FileText,
          path: 'document-viewer'
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          path: 'notifications'
        },
    {
      id: 'role-management',
      label: 'Role Management',
      icon: Shield,
      path: 'role-management'
    },
    {
      id: 'agent-management',
      label: 'Agent Management',
      icon: UserCog,
      children: [
        { id: 'agent-approvals', label: 'Agent Approvals', path: 'agent-approvals', icon: UserCheck },
        { id: 'agent-assignments', label: 'Property Assignments', path: 'agent-assignments', icon: Building2 },
        { id: 'agent-performance', label: 'Agent Performance', path: 'agent-performance', icon: BarChart3 },
        { id: 'unassigned-properties', label: 'Unassigned Properties', path: 'unassigned-properties', icon: Building2 }
      ]
    },
    {
      id: 'commission-tracking',
      label: 'Commission Tracking',
      icon: DollarSign,
      children: [
        { id: 'commission-overview', label: 'Commission Overview', path: 'commission-overview', icon: BarChart3 },
        { id: 'commission-payments', label: 'Commission Payments', path: 'commission-payments', icon: DollarSign },
        { id: 'agent-earnings', label: 'Agent Earnings', path: 'agent-earnings', icon: Users }
      ]
    },
    {
      id: 'admin-approvals',
      label: 'Admin Approvals',
      icon: UserCheck,
      path: 'admin-approvals'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      path: 'documents'
    }
  ];

  return (
    <div className={`bg-[#3B5998] text-white transition-all duration-300 flex-shrink-0 no-print
      ${sidebarCollapsed 
        ? 'w-16' 
        : 'w-64'
      } 
      fixed lg:relative z-50 h-full
      ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
      ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
    `}>
      {/* Logo */}
      <div className="p-3 sm:p-4 border-b border-blue-700">
        <div className="flex items-center">
          <div className="bg-white p-1.5 sm:p-2 rounded">
            <Home className="h-5 w-5 sm:h-6 sm:w-6 text-[#3B5998]" />
          </div>
          {!sidebarCollapsed && (
            <span className="ml-2 sm:ml-3 text-base sm:text-lg font-bold truncate">HOME & OWN</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 sm:py-4">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.children ? (
              <div>
                <button
                  onClick={() => onMenuToggle(item.id)}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 text-gray-300 hover:bg-blue-700 transition-colors text-sm sm:text-base ${
                    expandedMenus.includes(item.id) ? 'bg-blue-700' : ''
                  }`}
                >
                  <div className="flex items-center min-w-0">
                    <item.icon size={18} className="sm:w-5 sm:h-5" />
                    {!sidebarCollapsed && (
                      <span className="ml-2 sm:ml-3 truncate">{item.label}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    expandedMenus.includes(item.id) ? (
                      <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                    ) : (
                      <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                    )
                  )}
                </button>
                {expandedMenus.includes(item.id) && !sidebarCollapsed && (
                  <div className="ml-3 sm:ml-4 border-l border-blue-600">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onTabChange(child.path!)}
                        className={`w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors ${
                          activeTab === child.path
                            ? 'bg-green-500 text-white'
                            : 'text-gray-300 hover:bg-blue-700'
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onTabChange(item.path!)}
                className={`w-full flex items-center px-3 sm:px-4 py-2 text-sm sm:text-base transition-colors ${
                  activeTab === item.path
                    ? 'bg-green-500 text-white'
                    : 'text-gray-300 hover:bg-blue-700'
                }`}
              >
                <item.icon size={18} className="sm:w-5 sm:h-5" />
                {!sidebarCollapsed && (
                  <span className="ml-2 sm:ml-3 truncate">{item.label}</span>
                )}
              </button>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;