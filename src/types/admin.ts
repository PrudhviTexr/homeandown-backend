export interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalInquiries: number;
  pendingApprovals: number;
  notifications: any[];
  dailyStats: {
    newUsers: number;
    newProperties: number;
    newBookings: number;
    newInquiries: number;
  };
  weeklyStats: {
    users: number;
    properties: number;
    bookings: number;
    inquiries: number;
  };
  propertyValues: {
    totalSaleValue: number;
    totalRentValue: number;
    averagePrice: number;
    averageRent: number;
  };
  unassignedProperties: number;
}

export interface User {
  id: string;
  custom_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  user_type: string;
  status: string;
  verification_status: string;
  agent_license_number: string;
  created_at: string;
}

export interface Property {
  id: string;
  custom_id: string;
  title: string;
  property_type: string;
  city: string;
  price: number;
  monthly_rent: number;
  listing_type: string;
  status: string;
  featured: boolean;
  verified: boolean;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    custom_id: string;
  };
}

export interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
  properties: {
    title: string;
    custom_id: string;
  };
  users: {
    first_name: string;
    last_name: string;
    custom_id: string;
  };
  agent: {
    first_name: string;
    last_name: string;
    agent_license_number: string;
  };
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
  properties: {
    title: string;
    custom_id: string;
  };
}

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
}