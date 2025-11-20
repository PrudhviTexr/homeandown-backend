import { useState, useRef } from 'react';
import { AdminApi, RecordsApi } from '@/services/pyApi';
import { DashboardStats, User, Property, Booking, Inquiry } from '@/types/admin';
import toast from 'react-hot-toast';

export const useAdminData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalInquiries: 0,
    pendingApprovals: 0,
    notifications: [],
    dailyStats: { newUsers: 0, newProperties: 0, newBookings: 0, newInquiries: 0 },
    weeklyStats: { users: 0, properties: 0, bookings: 0, inquiries: 0 },
    propertyValues: { totalSaleValue: 0, totalRentValue: 0, averagePrice: 0, averageRent: 0 },
    unassignedProperties: 0
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const fetchInFlight = useRef(false);

  const fetchStats = async () => {
    try {
      const data = await AdminApi.stats();
      setStats(prev => ({
        ...prev,
        totalUsers: data.total_users || 0,
        totalProperties: data.total_properties || 0,
        totalBookings: data.total_bookings || 0,
        totalInquiries: data.total_inquiries || 0,
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Could not load dashboard statistics.');
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from admin API...');
      const data = await AdminApi.users();
      console.log(`Fetched ${(data || []).length} users`);
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchProperties = async () => {
    try {
      const data = await RecordsApi.listProperties();
      setProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties data. Please check your database connection.');
      setProperties([]);
    }
  };

  const fetchBookings = async () => {
    try {
      console.log('Fetching bookings from admin API...');
      const data = await AdminApi.listBookings();
      console.log(`Fetched ${(data || []).length} bookings`);
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      // Don't show error toast on initial load, just set empty array
      setBookings([]);
    }
  };

  const fetchInquiries = async () => {
    try {
      console.log('Fetching inquiries from admin API...');
      const data = await AdminApi.listInquiries();
      console.log(`Fetched ${(data || []).length} inquiries`);
      setInquiries(data || []);
    } catch (error: any) {
      console.error('Error fetching inquiries:', error);
      // Don't show error toast on initial load, just set empty array
      setInquiries([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      // First check if the notifications table exists
  setStats(prev => ({ ...prev, notifications: [] }));
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setStats(prev => ({ ...prev, notifications: [] }));
    }
  };

    const fetchAllData = async (showToast = false) => {
    // Prevent concurrent refreshes
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    setLoading(true);
    setIsRefreshing(true);

    try {
      // Fetch all data to ensure everything is up to date
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchProperties(),
        fetchBookings(),
        fetchInquiries()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to fetch some data from database');
    }

    if (showToast) {
      toast.success('Data refreshed successfully');
    }
    
    setLoading(false);
    setIsRefreshing(false);
    fetchInFlight.current = false;
  };

  const handleDeleteUser = async (_userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      // Pass id through as string to avoid Number coercion producing NaN
      await AdminApi.deleteUser(_userId);
      fetchAllData(true);
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Please try again.');
    }
  };

  const handleDeleteProperty = async (_propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      // Pass the string ID directly, don't convert to number (UUIDs can't be converted)
      await AdminApi.deleteProperty(_propertyId as any);
      fetchAllData(true);
      toast.success('Property deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete property. Please try again.');
    }
  };

  return {
    stats,
    users,
    properties,
    bookings,
    isRefreshing,
    inquiries,
    loading,
  fetchAllData,
  fetchUsers,
  fetchProperties,
  fetchBookings,
  fetchInquiries,
    handleDeleteUser,
    handleDeleteProperty
  };
};