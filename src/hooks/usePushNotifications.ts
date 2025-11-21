/**
 * React Hook for Push Notifications
 * Integrates push notification service with React components
 */
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import pushNotificationService from '@/services/pushNotificationService';
import { PushNotificationApi } from '@/services/pyApi';
import toast from 'react-hot-toast';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [initializing, setInitializing] = useState(false);

  // Check support on mount
  useEffect(() => {
    setIsSupported(pushNotificationService.isSupported());
    setPermission(pushNotificationService.getPermissionStatus());
  }, []);

  // Check subscription status
  useEffect(() => {
    if (user && isSupported) {
      checkSubscription();
    }
  }, [user, isSupported]);

  const checkSubscription = async () => {
    try {
      const subscription = await pushNotificationService.getSubscription();
      setIsSubscribed(subscription !== null);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const initialize = useCallback(async () => {
    if (!user || !isSupported) {
      return false;
    }

    try {
      setInitializing(true);
      const success = await pushNotificationService.initialize(user.id);
      
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
        toast.success('Push notifications enabled');
      } else {
        toast.error('Failed to enable push notifications');
      }
      
      return success;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      toast.error('Failed to enable push notifications');
      return false;
    } finally {
      setInitializing(false);
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user) {
      return false;
    }

    try {
      await pushNotificationService.unsubscribe();
      await pushNotificationService.removeSubscriptionFromBackend(user.id);
      
      setIsSubscribed(false);
      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to disable push notifications');
      return false;
    }
  }, [user]);

  const requestPermission = useCallback(async () => {
    try {
      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted' && user) {
        await initialize();
      }
      
      return newPermission;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return 'denied';
    }
  }, [user, initialize]);

  return {
    isSupported,
    isSubscribed,
    permission,
    initializing,
    initialize,
    unsubscribe,
    requestPermission
  };
};
