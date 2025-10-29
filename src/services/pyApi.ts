import { pyFetch, getPyApiBase } from '@/utils/backend';

export type LoginResponse = { user?: { id: number | string; email: string } };

export const AuthApi = {
  login(email: string, password: string) {
    return pyFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }) as Promise<LoginResponse>;
  },
  signup(payload: { email: string; password: string; first_name?: string; last_name?: string; role?: string }) {
    return pyFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) });
  },
  verifyEmail(token: string) {
    return pyFetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { method: 'GET' });
  },
  verifyEmailOtp(email: string, otp: string) {
    return pyFetch('/api/auth/verify-email-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
  },
  forgotPassword(email: string) {
    return pyFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },
  resetPassword(token: string, new_password: string) {
    return pyFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) });
  },
};

export const RecordsApi = {
  listProperties() {
    return pyFetch('/api/properties', { method: 'GET', useApiKey: false });
  },
  propertyContact(property_id: number | string, user_role?: string, user_id?: number) {
    const params = new URLSearchParams();
    if (user_role) params.set('user_role', user_role);
    if (user_id) params.set('user_id', String(user_id));
    const q = params.toString() ? `?${params.toString()}` : '';
    return pyFetch(`/api/properties/${property_id}/contact${q}`, { method: 'GET' });
  },
  createInquiry(payload: { property_id: number; name: string; email?: string; message?: string }) {
    return pyFetch('/api/inquiries', { method: 'POST', body: JSON.stringify(payload) });
  },
  createBooking(payload: { property_id: number; name: string; email?: string; preferred_time?: string }) {
    return pyFetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload), useApiKey: true });
  },
  updateBookingStatus(id: number, status: string) {
    return pyFetch(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  createProperty(payload: { title: string; price?: number; city: string; state: string; description?: string; added_by?: number; added_by_role?: string }) {
    return pyFetch('/api/properties', { method: 'POST', body: JSON.stringify(payload) });
  },
  // Viewings
  createViewing(payload: { property_id: number; user_id?: number; agent_id?: number; scheduled_at?: string; notes?: string }) {
    return pyFetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
  },
  listViewings() {
    return pyFetch('/api/bookings', { method: 'GET' });
  },
  updateViewing(id: number, payload: { status: string; completed_at?: string; notes?: string }) {
    return pyFetch(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  // Agent Reviews
  createAgentReview(payload: { agent_id: number; reviewer_user_id: number; property_id?: number; rating: number; comment?: string }) {
    return pyFetch('/agent-reviews', { method: 'POST', body: JSON.stringify(payload) });
  },
  listAgentReviews(agent_id?: number) {
    const q = agent_id ? `?agent_id=${agent_id}` : '';
    return pyFetch(`/agent-reviews${q}`, { method: 'GET' });
  }
};

export const AdminApi = {
  async doAdminFetch(path: string, options: RequestInit = {}) {
    // Try with API key first (recommended). If that fails (no key in frontend),
    // retry without API key as a development fallback.
    try {
      return await pyFetch(path, { ...options, useApiKey: true });
    } catch (err) {
      // If the server returned 401/403, surface a clearer error so the developer
      // knows to set PYTHON_API_KEY in the frontend to match PYTHON_API_KEY in backend.
      try {
        const _err: any = err;
        const status = (_err && _err.message && /status\s(\d{3})/.exec(_err.message)) ? Number(/status\s(\d{3})/.exec(_err.message)![1]) : null;
        if (status === 401 || status === 403) {
          const e = new Error(`Admin API unauthorized (HTTP ${status}). Ensure PYTHON_API_KEY in frontend matches PYTHON_API_KEY in backend.`);
          // @ts-ignore
          e.code = status;
          throw e;
        }
      } catch (e) {
        throw e;
      }
      try {
        return await pyFetch(path, { ...options, useApiKey: false });
      } catch (err2) {
        throw err2;
      }
    }
  },

  stats() {
    return this.doAdminFetch('/api/admin/stats', { method: 'GET' });
  },
  
  getPropertyAssignmentTracking(propertyId: string) {
    return this.doAdminFetch(`/api/admin/property-assignments/${propertyId}/tracking`, { method: 'GET' });
  },
  
  getAllAssignmentQueues(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.doAdminFetch(`/api/admin/property-assignments/queue${query}`, { method: 'GET' });
  },
  
  getUnassignedPropertiesForAssignments() {
    return this.doAdminFetch('/api/admin/property-assignments/unassigned', { method: 'GET' });
  },
  
  getPropertyComprehensiveStats(propertyId: string) {
    return this.doAdminFetch(`/api/admin/properties/${propertyId}/comprehensive-stats`, { method: 'GET' });
  },
  users() {
    return this.doAdminFetch('/api/admin/users', { method: 'GET' });
  },
  properties() {
    return this.doAdminFetch('/api/admin/properties', { method: 'GET' });
  },
  inquiries() {
    return this.doAdminFetch('/api/admin/inquiries', { method: 'GET' });
  },
  listInquiries() {
    return this.inquiries();
  },
  bookings() {
    return this.doAdminFetch('/api/admin/bookings', { method: 'GET' });
  },
  listBookings() {
    return this.bookings();
  },
  updateBookingStatus(id: number, status: string) {
    return pyFetch(`/api/records/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status }), useApiKey: true });
  },
  patchBookingFull(id: string, payload: any) {
    return pyFetch(`/api/records/bookings/${id}`, { method: 'PUT', body: JSON.stringify(payload), useApiKey: true });
  },
  documents(params?: { entity_type?: string; entity_id?: string | number }) {
    const qs = new URLSearchParams();
    if (params?.entity_type) qs.set('entity_type', params.entity_type);
    if (params?.entity_id) qs.set('entity_id', String(params.entity_id));
    const search = qs.toString() ? `?${qs.toString()}` : '';
    // Use the admin documents endpoint implemented on the Python API
    return pyFetch(`/api/admin/documents${search}`, { method: 'GET', useApiKey: true });
  },
  submitBankDetails(userId: number, payload: { bank_account_number: string; ifsc_code: string }) {
  return pyFetch(`/api/admin/users/${userId}/bank`, { method: 'POST', body: JSON.stringify(payload), useApiKey: true });
  },
  verifyBank(userId: number) {
  return pyFetch(`/api/admin/users/${userId}/verify-bank`, { method: 'POST', useApiKey: true });
  },
  approveAgent(userId: number, approve: boolean = true, note?: string) {
  return this.doAdminFetch(`/api/admin/users/${userId}/approve-agent`, { method: 'POST', body: JSON.stringify({ approve, note }) });
  },
  approveUser(userId: string | number) {
    return this.doAdminFetch(`/api/admin/users/${userId}/approve`, { method: 'POST' });
  },
  fixStatusMismatch() {
    return this.doAdminFetch(`/api/admin/users/fix-status-mismatch`, { method: 'POST' });
  },
  rejectUser(userId: string | number, reason: string) {
    return this.doAdminFetch(`/api/admin/users/${userId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
  },
  deleteUser(id: string | number) {
    return pyFetch(`/api/admin/users/${id}`, { method: 'DELETE', useApiKey: true });
  },
  patchUser(id: string | number, data: any) {
    return pyFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data), useApiKey: true });
  },
  setVerificationStatus(userId: number, status: string) {
    return pyFetch(`/api/admin/users/${userId}/verify-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }), useApiKey: true });
  },
  deleteProperty(id: number | string) {
    return pyFetch(`/api/properties/${id}`, { method: 'DELETE', useApiKey: true });
  },
  patchProperty(id: number | string, data: any) {
    return pyFetch(`/api/properties/${id}`, { method: 'PUT', body: JSON.stringify(data), useApiKey: true });
  },
  deleteBooking(id: number | string) {
    return pyFetch(`/api/records/bookings/${id}`, { method: 'DELETE', useApiKey: true });
  },
  deleteInquiry(id: number | string) {
    return pyFetch(`/api/inquiries/${id}`, { method: 'DELETE', useApiKey: true });
  },
  approveDocument(documentId: number) {
    return pyFetch(`/api/admin/documents/${documentId}/approve`, { method: 'POST', useApiKey: true });
  },
  rejectDocument(documentId: number, body?: { reason: string }) {
    return this.doAdminFetch(`/api/admin/documents/${documentId}/reject`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  },
  adminUploadDocument(userId: string, file: File, entityType: string, documentCategory: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_id', userId);
    formData.append('entity_type', entityType);
    formData.append('document_category', documentCategory);

    // Note: We are using pyFetch directly because it handles FormData correctly.
    // The 'Content-Type' header is set automatically by the browser for FormData.
    return pyFetch('/api/admin/documents/upload', {
      method: 'POST',
      body: formData,
      useApiKey: true, 
    });
  },
  approveProperty(propertyId: string) {
    return this.doAdminFetch(`/api/admin/properties/${propertyId}/approve`, { method: 'POST' });
  },
  rejectProperty(propertyId: string, reason?: string) {
    const body = reason ? JSON.stringify({ reason }) : undefined;
    return pyFetch(`/api/admin/properties/${propertyId}/reject`, { method: 'POST', body, useApiKey: true });
  },
  resubmitProperty(propertyId: string, reason?: string) {
    const body = reason ? JSON.stringify({ reason }) : undefined;
    return pyFetch(`/api/admin/properties/${propertyId}/resubmit`, { method: 'POST', body, useApiKey: true });
  },
  updateUser(userId: string, data: any) {
    return pyFetch(`/api/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data), useApiKey: true });
  },
  updateProperty(propertyId: string, data: any) {
    return pyFetch(`/api/admin/properties/${propertyId}`, { method: 'PUT', body: JSON.stringify(data), useApiKey: true });
  },
  // Commission Management
  getCommissionSummary() {
    return this.doAdminFetch('/api/admin/commissions/summary', { method: 'GET' });
  },
  getCommissionPayments() {
    return this.doAdminFetch('/api/admin/commission-payments', { method: 'GET' });
  },
  getAgentEarnings() {
    return this.doAdminFetch('/api/admin/agents/earnings', { method: 'GET' });
  },
  setPropertyCommission(propertyId: string, commissionData: any) {
    return pyFetch(`/api/admin/properties/${propertyId}/commission`, { method: 'POST', body: JSON.stringify(commissionData), useApiKey: true });
  },
  getUnassignedProperties() {
    return this.doAdminFetch('/api/admin/properties/unassigned', { method: 'GET' });
  },
  assignAgentToProperty(propertyId: string, agentId: string) {
    return this.doAdminFetch(`/api/admin/properties/${propertyId}/assign-agent`, { method: 'POST', body: JSON.stringify({ agent_id: agentId }) });
  }
};

export const AgentApi = {
  getDashboardStats() {
    return pyFetch('/api/agent/dashboard/stats', { method: 'GET', useApiKey: false });
  },
  getBookings(property_id?: string, status?: string, limit?: number) {
    const params = new URLSearchParams();
    if (property_id) params.set('property_id', property_id);
    if (status) params.set('status', status);
    if (limit) params.set('limit', String(limit));
    const q = params.toString() ? `?${params.toString()}` : '';
    return pyFetch(`/api/agent/bookings${q}`, { method: 'GET', useApiKey: false });
  },
  getInquiries(property_id?: string, status?: string, limit?: number) {
    const params = new URLSearchParams();
    if (property_id) params.set('property_id', property_id);
    if (status) params.set('status', status);
    if (limit) params.set('limit', String(limit));
    const q = params.toString() ? `?${params.toString()}` : '';
    return pyFetch(`/api/agent/inquiries${q}`, { method: 'GET', useApiKey: false });
  },
  getProperties(status?: string, limit?: number) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (limit) params.set('limit', String(limit));
    const q = params.toString() ? `?${params.toString()}` : '';
    return pyFetch(`/api/agent/properties${q}`, { method: 'GET', useApiKey: false });
  },
  updateBookingStatus(bookingId: string, status: string) {
    return pyFetch(`/api/bookings/${bookingId}`, { 
      method: 'PUT', 
      body: JSON.stringify({ status }), 
      useApiKey: false 
    });
  },
  respondToInquiry(inquiryId: string, response: string) {
    return pyFetch(`/api/inquiries/${inquiryId}/agent-response`, { 
      method: 'POST', 
      body: JSON.stringify({ response }), 
      useApiKey: false 
    });
  },
  getPendingPropertyAssignments() {
    return pyFetch('/api/agent/pending-assignments', { method: 'GET', useApiKey: false });
  },
  acceptPropertyAssignment(notificationId: string) {
    return pyFetch(`/api/agent/property-assignments/${notificationId}/accept`, { 
      method: 'POST', 
      useApiKey: false 
    });
  },
  rejectPropertyAssignment(notificationId: string, reason?: string) {
    return pyFetch(`/api/agent/property-assignments/${notificationId}/reject`, { 
      method: 'POST', 
      body: JSON.stringify({ reason }), 
      useApiKey: false 
    });
  }
};

export const FilesApi = {
  publicUrlById(id: number | string, url?: string) {
    // If a direct URL is provided (from Supabase storage), use it
    if (url) return url;
    // Otherwise, construct the API endpoint using the backend base URL
    const base = getPyApiBase(); // Use the utility function to get the correct backend URL
    return `${base}/api/files/${id}`;
  },
};

export const AnalyticsApi = {
  getTrends(timeRange: string = '30d', metric: string = 'all') {
    return pyFetch(`/api/analytics/trends?time_range=${timeRange}&metric=${metric}`, { method: 'GET', useApiKey: false });
  },
  
  getConversionFunnel(timeRange: string = '30d') {
    return pyFetch(`/api/analytics/conversion-funnel?time_range=${timeRange}`, { method: 'GET', useApiKey: true });
  },
  
  getRevenueAnalytics(timeRange: string = '30d') {
    return pyFetch(`/api/analytics/revenue?time_range=${timeRange}`, { method: 'GET', useApiKey: true });
  },
  
  exportCSV(reportType: string, timeRange: string = 'all') {
    return pyFetch(`/api/analytics/export/csv?report_type=${reportType}&time_range=${timeRange}`, { 
      method: 'GET', 
      useApiKey: true 
    });
  },
  
  getAdvancedAnalytics(range: string = '30d') {
    return AdminApi.doAdminFetch(`/api/admin/analytics?range=${range}`, { method: 'GET' });
  },
};

export const PushNotificationApi = {
  subscribe(subscription: any) {
    return pyFetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
      useApiKey: false
    });
  },
  
  unsubscribe() {
    return pyFetch('/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({}),
      useApiKey: false
    });
  },
};