import { pyFetch } from '@/utils/backend';

// Unified API service using Python backend exclusively
export class ApiService {
  // Authentication
  static async login(email: string, password: string) {
    try {
      console.log('[API] 🔑 Attempting login for:', email);
      const response = await pyFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        useApiKey: false
      });
      console.log('[API] ✅ Login response received');
      return response;
    } catch (error) {
      console.error('[API] ❌ Login error:', error);
      throw error;
    }
  }

  static async signup(userData: any) {
    try {
      console.log('[API] 📝 Attempting signup for:', userData.email);
      const response = await pyFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
        useApiKey: false
      });
      console.log('[API] ✅ Signup response received');
      return response;
    } catch (error) {
      console.error('[API] ❌ Signup error:', error);
      throw error;
    }
  }

  static async logout() {
    try {
      console.log('[API] 🚪 Logging out...');
      const response = await pyFetch('/api/auth/logout', { 
        method: 'POST',
        useApiKey: false 
      });
      console.log('[API] ✅ Logout successful');
      return response;
    } catch (error) {
      console.error('[API] ❌ Logout error:', error);
      throw error;
    }
  }

  static async getProfile() {
    try {
      console.log('[API] 👤 Getting user profile...');
      const response = await pyFetch('/api/auth/me', { 
        method: 'GET', 
        useApiKey: false 
      });
      console.log('[API] ✅ Profile received');
      return response;
    } catch (error) {
      console.error('[API] ❌ Get profile error:', error);
      throw error;
    }
  }

  // OTP Operations
  static async sendOTP(phone: string, action: string = 'verification') {
    try {
      console.log('[API] 📱 Sending OTP to:', phone, 'for action:', action);
      const response = await pyFetch('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, action }),
        useApiKey: false
      });
      console.log('[API] ✅ OTP sent');
      return response;
    } catch (error) {
      console.error('[API] ❌ Send OTP error:', error);
      throw error;
    }
  }

  static async verifyOTP(phone: string, otp: string, action: string = 'verification') {
    try {
      console.log('[API] 🔍 Verifying OTP for:', phone, 'action:', action);
      const response = await pyFetch('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, action }),
        useApiKey: false
      });
      console.log('[API] ✅ OTP verified');
      return response;
    } catch (error) {
      console.error('[API] ❌ Verify OTP error:', error);
      throw error;
    }
  }

  // Properties
  static async getProperties(filters: any = {}) {
    try {
      console.log('[API] 🏠 Fetching properties with filters:', filters);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      const query = params.toString() ? `?${params.toString()}` : '';
      
      const response = await pyFetch(`/api/properties${query}`, { 
        method: 'GET',
        useApiKey: false 
      });
      
      console.log('[API] ✅ Properties received:', Array.isArray(response) ? response.length : 'unknown count');
      
      // Ensure we always return an array
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object') {
        // If response is an object, try to extract array from common keys
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (response.properties && Array.isArray(response.properties)) {
          return response.properties;
        } else if (response.results && Array.isArray(response.results)) {
          return response.results;
        }
      }
      
      console.warn('[API] ⚠️ Response is not an array, returning empty array:', typeof response, response);
      return [];
    } catch (error) {
      console.error('[API] ❌ Get properties error:', error);
      throw error;
    }
  }

  static async getProperty(slug: string) {
    try {
      console.log('[API] 🏠 Fetching property by slug:', slug);
      
      // First, try to get all properties and find by slug
      const response = await pyFetch('/api/properties', { 
        method: 'GET',
        useApiKey: false 
      });
      
      if (Array.isArray(response)) {
        // Find property by matching slug with title
        const property = response.find((prop: any) => {
          const propertySlug = prop.title?.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
          return propertySlug === slug.toLowerCase();
        });
        
        if (property) {
          console.log('[API] ✅ Property found by slug');
          return property;
        }
      }
      
      // If not found by slug, try direct ID lookup (fallback)
      console.log('[API] 🔄 Trying direct ID lookup as fallback');
      const directResponse = await pyFetch(`/api/properties/${slug}`, { 
        method: 'GET',
        useApiKey: false 
      });
      console.log('[API] ✅ Property received via direct lookup');
      return directResponse;
    } catch (error) {
      console.error('[API] ❌ Get property error:', error);
      throw error;
    }
  }

  static async createProperty(propertyData: any) {
    try {
      console.log('[API] 🏗️  Creating property...');
      const response = await pyFetch('/api/properties', { 
        method: 'POST',
        body: JSON.stringify(propertyData),
        useApiKey: true 
      });
      console.log('[API] ✅ Property created');
      return response;
    } catch (error) {
      console.error('[API] ❌ Create property error:', error);
      throw error;
    }
  }

  // Inquiries
  static async createInquiry(inquiryData: any) {
    try {
      console.log('[API] 💬 Creating inquiry...');
      const response = await pyFetch('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify(inquiryData),
        useApiKey: false  // Allow anonymous inquiries
      });
      console.log('[API] ✅ Inquiry created');
      return response;
    } catch (error) {
      console.error('[API] ❌ Create inquiry error:', error);
      throw error;
    }
  }

  static async getUserInquiries() {
    try {
      console.log('[API] 💬 Getting user inquiries...');
      const response = await pyFetch('/api/inquiries', { 
        method: 'GET',
        useApiKey: false 
      });
      console.log('[API] ✅ Inquiries received');
      return response;
    } catch (error) {
      console.error('[API] ❌ Get inquiries error:', error);
      throw error;
    }
  }

  // Bookings
  static async createBooking(bookingData: any) {
    try {
      console.log('[API] 📅 Creating booking...');
      const response = await pyFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        useApiKey: true  // Require authentication for bookings
      });
      console.log('[API] ✅ Booking created');
      return response;
    } catch (error) {
      console.error('[API] ❌ Create booking error:', error);
      throw error;
    }
  }

  static async getUserBookings() {
    try {
      console.log('[API] 📅 Getting user bookings...');
      const response = await pyFetch('/api/bookings', { 
        method: 'GET',
        useApiKey: false 
      });
      console.log('[API] ✅ Bookings received');
      return response;
    } catch (error) {
      console.error('[API] ❌ Get bookings error:', error);
      throw error;
    }
  }

  // Profile Updates
  static async updateProfile(profileData: any) {
    try {
      console.log('[API] 👤 Updating profile...');
      const response = await pyFetch('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
        useApiKey: false
      });
      console.log('[API] ✅ Profile updated');
      return response;
    } catch (error: any) {
      console.error('[API] ❌ Update profile error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error.message?.includes('405') || error.message?.includes('Method Not Allowed')) {
        errorMessage = 'Profile update feature is temporarily unavailable. Please try again later.';
      } else if (error.message?.includes('NetworkError')) {
        errorMessage = 'Unable to reach the server. Please check your internet connection.';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const enhancedError = new Error(errorMessage);
      throw enhancedError;
    }
  }

  static async updateBankDetails(bankData: any) {
    try {
      console.log('[API] 🏦 Updating bank details...');
      const response = await pyFetch('/api/users/bank-details', {
        method: 'POST',
        body: JSON.stringify(bankData),
        useApiKey: false
      });
      console.log('[API] ✅ Bank details updated');
      return response;
    } catch (error) {
      console.error('[API] ❌ Update bank details error:', error);
      throw error;
    }
  }

  static async getBankDetails() {
    try {
      console.log('[API] 🏦 Getting bank details...');
      const response = await pyFetch('/api/users/bank-details', { 
        method: 'GET',
        useApiKey: false 
      });
      console.log('[API] ✅ Bank details received');
      return response;
    } catch (error) {
      console.error('[API] ❌ Get bank details error:', error);
      throw error;
    }
  }

  // Password Management
  static async changePassword(passwordData: any) {
    try {
      console.log('[API] 🔒 Changing password...');
      const response = await pyFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData),
        useApiKey: false
      });
      console.log('[API] ✅ Password changed');
      return response;
    } catch (error) {
      console.error('[API] ❌ Change password error:', error);
      throw error;
    }
  }

  static async forgotPassword(email: string) {
    try {
      console.log('[API] 🔑 Forgot password for:', email);
      const response = await pyFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        useApiKey: false
      });
      console.log('[API] ✅ Forgot password processed');
      return response;
    } catch (error) {
      console.error('[API] ❌ Forgot password error:', error);
      throw error;
    }
  }

  static async resetPassword(resetData: any) {
    try {
      console.log('[API] 🔄 Resetting password...');
      const response = await pyFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(resetData),
        useApiKey: false
      });
      console.log('[API] ✅ Password reset');
      return response;
    } catch (error) {
      console.error('[API] ❌ Reset password error:', error);
      throw error;
    }
  }

  // File Uploads
  static async uploadFile(file: File, entityType: string, entityId: string) {
    try {
      console.log('[API] 📤 Uploading file:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity_type', entityType);
      formData.append('entity_id', entityId);

      const response = await pyFetch('/uploads/upload', {
        method: 'POST',
        body: formData,
        useApiKey: true
      });
      
      console.log('[API] ✅ File uploaded');
      return response;
    } catch (error) {
      console.error('[API] ❌ Upload file error:', error);
      throw error;
    }
  }

  // Admin Operations
  static async getUsers() {
    try {
      console.log('[API] 👥 Getting all users...');
      const response = await pyFetch('/api/admin/users', { 
        method: 'GET', 
        useApiKey: true 
      });
      console.log('[API] ✅ Users received');
      return response;
    } catch (error) {
      console.error('[API] ❌ Get users error:', error);
      throw error;
    }
  }

  static async getStats() {
    try {
      console.log('[API] 📊 Getting stats...');
      const response = await pyFetch('/api/admin/stats', { 
        method: 'GET', 
        useApiKey: true 
      });
      console.log('[API] ✅ Stats received');
      return response;
    } catch (error) {
      console.error('[API] ❌ Get stats error:', error);
      throw error;
    }
  }

  static async getInquiries() {
    try {
      console.log('[API] 💬 Getting inquiries...');
      const response = await pyFetch('/api/inquiries', { 
        method: 'GET',
        useApiKey: true 
      });
      console.log('[API] ✅ Inquiries received');
      return response;
    } catch (error) {
      console.error('[API] ❌ Get inquiries error:', error);
      throw error;
    }
  }

  static async getBookings() {
    try {
      console.log('[API] 📅 Getting bookings...');
      const response = await pyFetch('/api/bookings', { 
        method: 'GET',
        useApiKey: true 
      });
      console.log('[API] ✅ Bookings received');
      return response;
    } catch (error) {
      console.error('[API] ❌ Get bookings error:', error);
      throw error;
    }
  }
}

export default ApiService;