import React, { useState, useEffect } from 'react';
import { Bell, User, Building2, MessageSquare, Calendar, Check, X, Filter, Search } from 'lucide-react';
import { AdminApi } from '@/services/pyApi';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  entity_type: string;
  entity_id: string;
  read: boolean;
  created_at: string;
  userName?: string;
  propertyName?: string;
  propertyId?: string;
  agentName?: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch notifications from different sources
      const [users, inquiries, bookings, properties] = await Promise.all([
        AdminApi.users() as Promise<any[]>,
        AdminApi.inquiries() as Promise<any[]>,
        AdminApi.bookings() as Promise<any[]>,
        AdminApi.properties() as Promise<any[]>,
      ]);

      const items: Notification[] = [];
      const userMap = new Map((users || []).map(u => [u.id, `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email]));
      const propertyMap = new Map((properties || []).map(p => [p.id, p]));
      
      // Convert users to notifications
      (users || []).forEach((u: any) => {
        if (u.verification_status === 'pending') {
          items.push({
            id: `user-${u.id}`,
            title: 'New User Registration',
            message: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'New user registered',
            type: 'user_registration',
            entity_type: 'user',
            entity_id: String(u.id),
            read: false,
            created_at: u.created_at || new Date().toISOString(),
            userName: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          });
        }
      });

      // Convert inquiries to notifications
      (inquiries || []).forEach((inq: any) => {
        const property = propertyMap.get(inq.property_id);
        const agentName = property?.agent_id ? userMap.get(property.agent_id) : 'Unassigned';
        items.push({
          id: `inquiry-${inq.id}`,
          title: 'New Property Inquiry',
          message: inq.message || 'Customer inquiry received',
          type: 'inquiry',
          entity_type: 'inquiry',
          entity_id: String(inq.id),
          read: false,
          created_at: inq.created_at || new Date().toISOString(),
          userName: inq.name,
          propertyName: property?.title,
          propertyId: property?.id,
          agentName: agentName,
        });
      });

      // Convert bookings to notifications
      (bookings || []).forEach((booking: any) => {
        const property = propertyMap.get(booking.property_id);
        const agentName = property?.agent_id ? userMap.get(property.agent_id) : 'Unassigned';
        items.push({
          id: `booking-${booking.id}`,
          title: 'New Property Booking',
          message: booking.notes || 'Booking scheduled',
          type: 'booking',
          entity_type: 'booking',
          entity_id: String(booking.id),
          read: false,
          created_at: booking.created_at || new Date().toISOString(),
          userName: userMap.get(booking.user_id) || 'Unknown User',
          propertyName: property?.title,
          propertyId: property?.id,
          agentName: agentName,
        });
      });

      // Sort by creation date (newest first)
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'inquiry':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'booking':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'property':
        return <Building2 className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.type === filter;
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getFilterCount = (type: string) => {
    if (type === 'all') return notifications.length;
    return notifications.filter(n => n.type === type).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            Stay updated with all system activities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <User className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">User Registrations</p>
              <p className="text-2xl font-bold text-gray-900">{getFilterCount('user_registration')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{getFilterCount('inquiry')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{getFilterCount('booking')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            {['all', 'user_registration', 'inquiry', 'booking'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  filter === filterType
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {filterType === 'all' ? 'All' : filterType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                <span className="ml-1 text-xs">({getFilterCount(filterType)})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
            <span className="ml-2">Loading notifications...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' 
                ? 'No notifications match your current filters.' 
                : 'You\'re all caught up! No new notifications.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        {notification.userName && <p><strong>User:</strong> {notification.userName}</p>}
                        {notification.propertyName && <p><strong>Property:</strong> {notification.propertyName}</p>}
                        {notification.agentName && <p><strong>Agent:</strong> {notification.agentName}</p>}
                        <p>{formatTimeAgo(notification.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Navigate to relevant page based on entity type
                        if (notification.entity_type === 'user') {
                          window.location.href = '/admin/user-approvals';
                        } else if (notification.entity_type === 'inquiry') {
                          window.location.href = '/admin/inquiries';
                        } else if (notification.entity_type === 'booking') {
                          window.location.href = '/admin/bookings';
                        } else if (notification.propertyId) {
                          window.location.href = `/property/${notification.propertyId}`;
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="View details"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
