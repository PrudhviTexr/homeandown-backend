import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminApi, RecordsApi } from '@/services/pyApi';
// Switched to polling via Python backend

interface Notification {
  id: string;
  type: 'inquiry' | 'booking' | 'system';
  title: string;
  message: string;
  property_title?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  created_at: string;
  read: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const NotificationSystem: React.FC = () => {
  // Disable polling/UI in production builds
  if (import.meta.env.PROD) return null;
  const { user, getUserProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

  fetchNotifications();

    // Poll for updates periodically
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30s

    return () => clearInterval(interval);
  }, [user]);

  // No helper necessary; property ownership is derived inline in fetchNotifications

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      let built: Notification[] = [];

  // Prefer cached user from context to avoid network request
  const userType = (user as any)?.user_type || (await getUserProfile(true))?.user_type;
      if (userType === 'seller' || userType === 'agent') {
        const properties = (await RecordsApi.listProperties()) as any[];
        const mine = properties.filter((p: any) => p?.owner_id === user.id);
        const propIdSet = new Set(mine.map((p: any) => p.id));
        const propTitleById = new Map<string | number, string>();
        mine.forEach((p: any) => propTitleById.set(p.id, p.title || 'Property'));

        const [inquiries, bookings] = await Promise.all([
          AdminApi.inquiries() as Promise<any[]>,
          AdminApi.bookings() as Promise<any[]>,
        ]);

        const filteredInquiries = (inquiries || []).filter((i: any) => propIdSet.has(i.property_id));
        const filteredBookings = (bookings || []).filter((b: any) => propIdSet.has(b.property_id));

        const inquiryNotifications: Notification[] = filteredInquiries.map((inquiry: any) => ({
          id: `inquiry-${inquiry.id}`,
          type: 'inquiry',
          title: 'New Property Inquiry',
          message: `${inquiry.name ?? 'Someone'} is interested in ${propTitleById.get(inquiry.property_id) || 'your property'}`,
          property_title: propTitleById.get(inquiry.property_id) || 'Property',
          user_name: inquiry.name ?? undefined,
          user_email: inquiry.email ?? undefined,
          user_phone: inquiry.phone ?? undefined,
          created_at: inquiry.created_at,
          read: false,
          priority: 'high',
        }));

        const bookingNotifications: Notification[] = filteredBookings.map((booking: any) => {
          const displayName = booking.user_name || [booking.first_name, booking.last_name].filter(Boolean).join(' ') || 'User';
          return {
            id: `booking-${booking.id}`,
            type: 'booking',
            title: 'New Tour Request',
            message: `${displayName} wants to tour ${propTitleById.get(booking.property_id) || 'your property'}`,
            property_title: propTitleById.get(booking.property_id) || 'Property',
            user_name: displayName,
            user_email: booking.user_email || booking.email || '',
            user_phone: booking.user_phone || booking.phone_number || '',
            created_at: booking.created_at,
            read: false,
            priority: 'high',
          } as Notification;
        });

        built = [...inquiryNotifications, ...bookingNotifications]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 15);
      }

      setNotifications(built);
      setUnreadCount(built.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <MessageCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const [userCanViewNotifications, setUserCanViewNotifications] = useState(false);

  useEffect(() => {
    const checkUserType = async () => {
      if (!user) {
        setUserCanViewNotifications(false);
        return;
      }
      
      const profile = await getUserProfile();
      const userType = profile?.user_type;
      setUserCanViewNotifications(userType === 'seller' || userType === 'agent');
    };
    
    checkUserType();
  }, [user, getUserProfile]);

  if (!userCanViewNotifications) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100 z-50"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div 
          className="navbar-dropdown absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border max-h-[80vh] overflow-hidden"
          style={{ zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">Stay updated with your property inquiries</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-[#90C641] hover:text-[#7DAF35] font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-sm">You'll see inquiries and tour requests here</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      {notification.type === 'inquiry' ? (
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                      ) : notification.type === 'booking' ? (
                        <Calendar className="h-5 w-5 text-green-500" />
                      ) : (
                        getPriorityIcon(notification.priority)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {notification.priority === 'high' && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            High
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      {/* Contact Information */}
                      {notification.user_email && (
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>📧 {notification.user_email}</p>
                          {notification.user_phone && (
                            <p>📱 {notification.user_phone}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {notification.property_title && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {notification.property_title.length > 20 
                              ? `${notification.property_title.substring(0, 20)}...`
                              : notification.property_title
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;