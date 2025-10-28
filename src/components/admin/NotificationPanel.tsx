import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, MessageSquare, Calendar, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminApi } from '@/services/pyApi';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  entity_type: string;
  entity_id: string;
  read: boolean;
  created_at: string;
}

const NotificationPanel: React.FC = () => {
  // Disable in production to avoid background polling
  if (import.meta.env.PROD) return null;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 15000);
    return () => clearInterval(id);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [users, inq, bok] = await Promise.all([
        AdminApi.users() as Promise<any[]>,
        AdminApi.inquiries() as Promise<any[]>,
        AdminApi.bookings() as Promise<any[]>,
      ]);
      const items: Notification[] = [];
      (users || []).slice(0, 5).forEach((u: any) => items.push({ id: `usr-${u.id}`, title: 'New User', message: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'New user registered', type: 'user_registration', entity_type: 'user', entity_id: String(u.id), read: false, created_at: u.created_at || new Date().toISOString() }));
      (inq || []).slice(0, 10).forEach((q: any) => items.push({ id: `inq-${q.id}`, title: 'New Inquiry', message: q.message || 'Customer inquiry received', type: 'inquiry', entity_type: 'inquiry', entity_id: String(q.id), read: false, created_at: q.created_at || new Date().toISOString() }));
      (bok || []).slice(0, 10).forEach((b: any) => items.push({ id: `bok-${b.id}`, title: 'New Booking', message: b.notes || 'Booking scheduled', type: 'booking', entity_type: 'booking', entity_id: String(b.id), read: false, created_at: b.created_at || new Date().toISOString() }));
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read).length || 0);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    }
  };

  const markAsRead = async (notificationId: string) => {
  setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'inquiry':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'booking':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'verification':
        return <CheckCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="p-2 hover:bg-blue-700 rounded relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <>
                {/* Show only first 5 notifications */}
                {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
                ))}
                
                {/* View All button if there are more notifications */}
                {notifications.length > 5 && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        // Navigate to full notifications page
                        window.location.href = '/admin/notifications';
                      }}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All {notifications.length} Notifications →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 text-center">
            <button
              onClick={() => setShowPanel(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;