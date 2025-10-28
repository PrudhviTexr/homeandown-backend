import { pyFetch } from '@/utils/backend';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  read: boolean;
  created_at: string;
}

export const NotificationApi = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await pyFetch('/api/admin/notifications', {
        method: 'GET',
        useApiKey: true,
      });
      return response || [];
    } catch (error) {
      console.error('[NotificationApi] Error fetching notifications:', error);
      return [];
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await pyFetch(`/api/admin/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        useApiKey: true,
      });
    } catch (error) {
      console.error('[NotificationApi] Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const unreadNotifications = notifications.filter(n => !n.read);
      
      await Promise.all(
        unreadNotifications.map(n => this.markAsRead(n.id))
      );
    } catch (error) {
      console.error('[NotificationApi] Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('[NotificationApi] Error getting unread count:', error);
      return 0;
    }
  },
};
