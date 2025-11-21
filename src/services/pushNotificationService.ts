/**
 * Push Notification Service
 * Handles browser push notification subscriptions and receiving notifications
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Check if browser supports push notifications
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      this.registration = registration;
      console.log('[Push Service] Service worker registered:', registration);
      
      return registration;
    } catch (error) {
      console.error('[Push Service] Service worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription> {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      throw new Error('Service worker registration failed');
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VAPID public key is not configured');
    }

    try {
      // Check existing subscription
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      // Convert to our format
      const key = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!key || !auth) {
        throw new Error('Failed to get subscription keys');
      }

      this.subscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(key),
          auth: this.arrayBufferToBase64(auth)
        }
      };

      console.log('[Push Service] Subscribed to push notifications');
      return this.subscription;
    } catch (error) {
      console.error('[Push Service] Subscription failed:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        this.subscription = null;
        console.log('[Push Service] Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Push Service] Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (!subscription) {
        return null;
      }

      const key = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!key || !auth) {
        return null;
      }

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(key),
          auth: this.arrayBufferToBase64(auth)
        }
      };
    } catch (error) {
      console.error('[Push Service] Get subscription failed:', error);
      return null;
    }
  }

  /**
   * Send subscription to backend
   */
  async saveSubscriptionToBackend(userId: string): Promise<void> {
    if (!this.subscription) {
      await this.subscribe();
    }

    if (!this.subscription) {
      throw new Error('Failed to get subscription');
    }

    const { pyFetch } = await import('@/utils/backend');
    await pyFetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        subscription: this.subscription
      }),
      useApiKey: false
    });
  }

  /**
   * Remove subscription from backend
   */
  async removeSubscriptionFromBackend(userId: string): Promise<void> {
    const { pyFetch } = await import('@/utils/backend');
    await pyFetch('/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({}),
      useApiKey: false
    });
  }

  /**
   * Initialize push notifications for a user
   */
  async initialize(userId: string): Promise<boolean> {
    try {
      // Check if supported
      if (!this.isSupported()) {
        console.warn('[Push Service] Push notifications not supported');
        return false;
      }

      // Request permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('[Push Service] Notification permission denied');
        return false;
      }

      // Register service worker
      await this.registerServiceWorker();

      // Subscribe
      await this.subscribe();

      // Save to backend
      await this.saveSubscriptionToBackend(userId);

      console.log('[Push Service] Push notifications initialized');
      return true;
    } catch (error) {
      console.error('[Push Service] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Helper: Convert VAPID key from base64 URL to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Helper: Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
