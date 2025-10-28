import React, { useState } from 'react';
import ViewingStatusPanel from '../agent/ViewingStatusPanel';
import { Users, Building2, Calendar, MessageSquare, Plus } from 'lucide-react';
import AdminTable from './AdminTable';

interface DashboardOverviewProps {
  stats: {
    totalUsers: number;
    totalProperties: number;
    totalBookings: number;
    totalInquiries: number;
    pendingApprovals?: number;
  };
  onCardClick: (cardType: string) => void;
  onAddUser: () => void;
  onAddProperty: () => void;
  users: any[];
  properties: any[];
  bookings: any[];
  inquiries: any[];
  onRefresh: () => void;
  onViewUser?: (user: any) => void;
  onEditUser?: (user: any) => void;
  onDeleteUser?: (id: string) => void;
  onViewProperty?: (property: any) => void;
  onEditProperty?: (property: any) => void;
  onDeleteProperty?: (id: string) => void;
  onViewBooking?: (booking: any) => void;
  onEditBooking?: (booking: any) => void;
  onDeleteBooking?: (id: string) => void;
  onViewInquiry?: (inquiry: any) => void;
  onAssignAgent?: (inquiry: any) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  onCardClick,
  onAddUser,
  onAddProperty,
  users,
  properties,
  bookings,
  inquiries,
  onRefresh,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onViewProperty,
  onEditProperty,
  onDeleteProperty,
  onViewBooking,
  onEditBooking,
  onDeleteBooking,
  onViewInquiry,
  onAssignAgent,
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const { totalUsers, totalProperties, totalBookings, totalInquiries, pendingApprovals = 0 } = stats;

  const handleCardClick = (cardType: string) => {
    if (expandedCard === cardType) {
      setExpandedCard(null);
    } else {
      setExpandedCard(cardType);
    }
  };

  const getUserColumns = () => [
    { key: 'custom_id', header: 'ID' },
    { key: 'first_name', header: 'Name', render: (user: any) => `${user.first_name} ${user.last_name}` },
    { key: 'email', header: 'Email' },
    { key: 'user_type', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'verification_status', header: 'Verification' },
    { key: 'agent_license_number', header: 'License', render: (u: any) => u.agent_license_number || '-' },
    { key: 'account_verified', header: 'Bank', render: (u: any) => u.account_verified ? '✔' : '✖' }
  ];

  const getPropertyColumns = () => [
    { key: 'custom_id', header: 'ID' },
    { key: 'title', header: 'Title' },
    { key: 'property_type', header: 'Type' },
    { key: 'city', header: 'City' },
    { key: 'listing_type', header: 'Listing Type' },
    { key: 'status', header: 'Status' }
  ];

  const getBookingColumns = () => [
    { key: 'booking_date', header: 'Date', render: (booking: any) => new Date(booking.booking_date).toLocaleDateString() },
    { key: 'booking_time', header: 'Time' },
    { key: 'property_title', header: 'Property' },
    { key: 'customer_name', header: 'Customer' },
    { key: 'agent_name', header: 'Agent' },
    { key: 'status', header: 'Status' }
  ];

  const getInquiryColumns = () => [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'property', header: 'Property', render: (inquiry: any) => {
        const property = properties.find(p => p.id === inquiry.property_id);
        return property ? property.title : 'N/A';
      }
    },
    { key: 'message', header: 'Message', render: (inquiry: any) =>
      inquiry.message.length > 50 ? inquiry.message.substring(0, 50) + '...' : inquiry.message
    },
    { key: 'status', header: 'Status' }
  ];

  const renderExpandedData = (cardType: string) => {
    switch (cardType) {
      case 'users':
        return <AdminTable data={users.slice(0, 10)} columns={getUserColumns()} title="Recent Users" onRefresh={onRefresh} onView={onViewUser} onEdit={onEditUser} onDelete={onDeleteUser} />;
      case 'properties':
        return <AdminTable data={properties.slice(0, 10)} columns={getPropertyColumns()} title="Recent Properties" onRefresh={onRefresh} onView={onViewProperty} onEdit={onEditProperty} onDelete={onDeleteProperty} />;
      case 'bookings':
        return <AdminTable data={bookings.slice(0, 10)} columns={getBookingColumns()} title="Recent Bookings" onRefresh={onRefresh} onView={onViewBooking} onEdit={onEditBooking} onDelete={onDeleteBooking} />;
      case 'inquiries':
        return <AdminTable data={inquiries.slice(0, 10)} columns={getInquiryColumns()} title="Recent Inquiries" onRefresh={onRefresh} onView={onViewInquiry} onAssignAgent={onAssignAgent} />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick('users')}>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick('properties')}>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg"><Building2 className="h-6 w-6 text-green-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{totalProperties}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick('bookings')}>
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg"><Calendar className="h-6 w-6 text-yellow-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick('inquiries')}>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg"><MessageSquare className="h-6 w-6 text-purple-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{totalInquiries}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onCardClick('user-approvals')}>
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg"><Users className="h-6 w-6 text-yellow-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      {expandedCard && <div className="mt-6">{renderExpandedData(expandedCard)}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Values</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(properties.filter(p => p.listing_type === 'SALE').reduce((acc, p) => acc + (p.price || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Sale Value</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(properties.filter(p => p.listing_type === 'RENT').reduce((acc, p) => acc + (p.monthly_rent || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Rent Value</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center"><span className="text-gray-600">New Users</span><span className="font-semibold">0</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600">New Properties</span><span className="font-semibold">0</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600">New Bookings</span><span className="font-semibold">0</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600">New Inquiries</span><span className="font-semibold">0</span></div>
            <div className="flex justify-between items-center border-t pt-2"><span className="text-red-600">Unassigned Properties</span><span className="font-semibold text-red-600">{properties.filter(p => !p.agent_id).length}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Viewing Status Management</h3>
          <ViewingStatusPanel />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={onAddUser} className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="flex items-center"><Plus className="h-5 w-5 text-blue-600 mr-3" /><span>Add New User</span></div>
              <span className="text-blue-600">→</span>
            </button>
            <button onClick={onAddProperty} className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="flex items-center"><Plus className="h-5 w-5 text-green-600 mr-3" /><span>Add New Property</span></div>
              <span className="text-green-600">→</span>
            </button>
            <button onClick={() => onCardClick('users')} className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="flex items-center"><Users className="h-5 w-5 text-purple-600 mr-3" /><span>Manage Users</span></div>
              <span className="text-purple-600">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;