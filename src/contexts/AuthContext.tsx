import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { pyFetch } from '@/utils/backend';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  email_verified: boolean;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any; success?: boolean }>;
  devSignIn?: (email: string, password: string) => Promise<{ error?: any; success?: boolean; user?: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: any; success?: boolean }>;
  signOut: () => Promise<void>;
  getUserProfile: (force?: boolean) => Promise<any>;
  sendOTP: (phone: string, action: string) => Promise<{ success: boolean; error?: string; otp?: string }>;
  verifyOTP: (phone: string, otp: string, action: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('[AUTH] Checking auth status...');
      // Try to hydrate from sessionStorage to avoid network requests during
      // dev double-mounts / HMR where the provider may remount frequently.
      try {
        const cached = sessionStorage.getItem('auth_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id) {
            console.log('[AUTH] Hydrated profile from sessionStorage');
            setUser(parsed);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // ignore sessionStorage errors (e.g., SSR or private mode)
      }
      // Reuse any in-flight profile fetch
      if (profileFetchRef.current) {
        const existing = await profileFetchRef.current;
        if (existing && existing.id) {
          setUser(existing);
        } else {
          setUser(null);
        }
        return;
      }

      profileFetchRef.current = pyFetch('/api/auth/me', { method: 'GET', useApiKey: false });
      const profile = await profileFetchRef.current;
      profileFetchRef.current = null;

      if (profile && profile.id) {
        console.log('[AUTH] User authenticated:', profile.email);
        setUser(profile);
  try { sessionStorage.setItem('auth_profile', JSON.stringify(profile)); } catch (e) {}
      } else {
        console.log('[AUTH] No active session');
        setUser(null);
      }
    } catch (error) {
      console.log('[AUTH] No active session or token expired');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AUTH] Signing in:', email);
      
      const response = await pyFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase(), password }),
        useApiKey: false
      });

      if (response.success && response.user) {
        console.log('[AUTH] Sign in successful');
        // If the backend returned an access token, use it to hydrate the profile
        // immediately via Authorization header so the app does not rely solely
        // on cookies (which can be blocked in dev due to the Secure flag).
        let hydrated: any = undefined;
        try {
          const authToken = response.token;
          if (authToken) {
            hydrated = await pyFetch('/api/auth/me', {
              method: 'GET',
              headers: { Authorization: `Bearer ${authToken}` },
              useApiKey: false
            });
            if (hydrated && hydrated.id) {
              setUser(hydrated);
              try { sessionStorage.setItem('auth_profile', JSON.stringify(hydrated)); } catch (e) {}
            } else {
              // Fallback to returned user object
              setUser(response.user);
              try { sessionStorage.setItem('auth_profile', JSON.stringify(response.user)); } catch (e) {}
            }
          } else {
            setUser(response.user);
          }
        } catch (hydrateErr) {
          console.warn('[AUTH] Failed to hydrate profile with token, using returned user', hydrateErr);
          setUser(response.user);
          try { sessionStorage.setItem('auth_profile', JSON.stringify(response.user)); } catch (e) {}
        }

        toast.success('Welcome back!');
        // Return the hydrated user (if available) so callers get the freshest profile
        const returnedUser = (hydrated && hydrated.id) ? hydrated : response.user;
        // Ensure sessionStorage reflects the returned user
        try { sessionStorage.setItem('auth_profile', JSON.stringify(returnedUser)); } catch (e) {}
        // Return the user object so callers don't have to rely on immediate state update
        return { success: true, user: returnedUser };
      } else {
        return { error: response.error || 'Invalid credentials' };
      }
    } catch (error: any) {
      console.error('[AUTH] Sign in error:', error);
      
      const errorMessage = error.message || 'Sign in failed';
      
      if (errorMessage.includes('pending admin approval')) {
        return { 
          error: 'approval_pending',
          message: 'Your account is pending admin approval. Please wait for admin approval before you can login.',
          email: email,
          userType: 'user'
        };
      }
      if (errorMessage.includes('Email not verified')) {
        return { error: 'Please verify your email before signing in. Check your inbox for verification link.' };
      }
      if (errorMessage.includes('pending verification') || errorMessage.includes('not verified')) {
        return { error: 'Your account is pending verification. Please wait for admin approval or contact support.' };
      }
      if (errorMessage.includes('not active')) {
        return { error: 'Your account is not active. Please contact support for assistance.' };
      }
      if (errorMessage.includes('Invalid email or password')) {
        return { error: 'Invalid email or password. Please check your credentials.' };
      }
      
      return { error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('[AUTH] Signing up:', email, 'as', userData.userType);
      
      const response = await pyFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.userType || 'buyer',
          phone_number: userData.phone_number,
          city: userData.city,
          state: userData.state
        }),
        useApiKey: false
      });

      if (response.success) {
        console.log('[AUTH] Sign up successful');
        // Don't auto-login after signup - require email verification first
        setUser(null);
        toast.success('Account created! Please check your email to verify your account.');
        return { success: true };
      } else {
        return { error: response.error || 'Signup failed' };
      }
    } catch (error: any) {
      console.error('[AUTH] Sign up error:', error);
      const errorMessage = error.message || 'Signup failed. Please try again.';
      
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        return { error: 'An account with this email already exists. Please sign in or use forgot password.' };
      }
      
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      console.log('[AUTH] Signing out...');
      await pyFetch('/api/auth/logout', { method: 'POST', useApiKey: false });
      console.log('[AUTH] Signed out successfully');
    } catch (error) {
      console.error('[AUTH] Sign out error:', error);
    } finally {
  setUser(null);
  try { sessionStorage.removeItem('auth_profile'); } catch (e) {}
      toast.success('Signed out successfully');
    }
  };

  // Development-only helper to allow hardcoded admin login without calling the backend.
  const devSignIn = async (email: string, password: string) => {
    try {
      // WARNING: This is a development-only shortcut. Do NOT enable in production.
      const DEV_ADMIN_EMAIL = 'admin@homeandown.com';
      const DEV_ADMIN_PASSWORD = 'Frisco@2025';
      if (email.toLowerCase() === DEV_ADMIN_EMAIL && password === DEV_ADMIN_PASSWORD) {
        console.warn('[AUTH][DEV] Using hardcoded dev admin sign-in. This should only run in development.');
        const devUser = {
          id: 'dev-admin',
          email: DEV_ADMIN_EMAIL,
          first_name: 'Dev',
          last_name: 'Admin',
          user_type: 'admin',
          email_verified: true,
        };
        setUser(devUser as any);
        try { sessionStorage.setItem('auth_profile', JSON.stringify(devUser)); } catch (e) {}
        toast.success('Signed in as dev admin');
        return { success: true, user: devUser };
      }
      return { error: 'Dev credentials did not match' };
    } catch (error: any) {
      return { error: error.message || 'Dev sign-in failed' };
    }
  };

  /**
   * Returns the current user profile.
   * By default this returns the cached `user` value to avoid repeated network
   * requests. Pass `force=true` to always re-fetch from the backend.
   */
  const getUserProfile = async (force: boolean = false) => {
    try {
      // If we have a cached user and no forced refresh requested, return it.
      if (user && !force) return user;

      // If a fetch is already underway, reuse it.
      if (profileFetchRef.current) {
        const ongoing = await profileFetchRef.current;
        return ongoing || user;
      }

      profileFetchRef.current = pyFetch('/api/auth/me', { method: 'GET', useApiKey: false });
      const profile = await profileFetchRef.current;
      profileFetchRef.current = null;

      if (profile && profile.id) {
        setUser(profile);
        return profile;
      }
      return user;
    } catch (error) {
      console.error('[AUTH] Get profile error:', error);
      profileFetchRef.current = null;
      return user;
    }
  };

  const sendOTP = async (phone: string, action: string = "verification") => {
    try {
      console.log('[OTP] Sending OTP to:', phone, 'for action:', action);
      
      const response = await pyFetch('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, action }),
        useApiKey: false
      });
      
      if (response.success) {
        console.log('[OTP] OTP sent successfully');
        toast.success('OTP sent to your phone');
        return { 
          success: true, 
          otp: response.otp // Only in development mode
        };
      }
      
      return { success: false, error: 'Failed to send OTP' };
    } catch (error: any) {
      console.error('[OTP] Send OTP error:', error);
      return { success: false, error: error.message || 'Failed to send OTP' };
    }
  };

  const verifyOTP = async (phone: string, otp: string, action: string = "verification") => {
    try {
      console.log('[OTP] Verifying OTP:', otp, 'for', phone, 'action:', action);
      
      const response = await pyFetch('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, action }),
        useApiKey: false
      });
      
      if (response.success) {
        console.log('[OTP] OTP verified successfully');
        toast.success('OTP verified successfully');
        return { success: true };
      }
      
      return { success: false, error: 'Invalid OTP' };
    } catch (error: any) {
      console.error('[OTP] Verify OTP error:', error);
      return { success: false, error: error.message || 'Invalid OTP' };
    }
  };

  const value = {
    user,
    loading,
    signIn,
  devSignIn,
    signUp,
    signOut,
    getUserProfile,
    sendOTP,
    verifyOTP,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};