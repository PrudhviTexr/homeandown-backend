// Database type definitions aligned to Python backend schema

export interface Property {
  id: string;
  title: string;
  description: string;
  price?: number | null;
  monthly_rent?: number | null;
  security_deposit?: number | null;
  property_type: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number | null;
  longitude?: number | null;
  owner_id?: string | null;
  status?: string;
  listing_type: string;
  furnishing_status?: string | null;
  available_from?: string | null;
  featured?: boolean;
  verified?: boolean;
  images?: string[] | null;
  amenities?: string[] | null;
  district?: string | null;
  mandal?: string | null;
  custom_id?: string | null;
  created_at?: string;
  updated_at?: string;
  // Legacy support
  state_id?: string;
  district_id?: string;
  mandal_id?: string;
}

export interface Booking {
  id: string;
  property_id: string;
  user_id: string;
  agent_id?: string | null;
  booking_date: string;
  booking_time: string;
  status?: string;
  notes?: string | null;
  custom_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  user_type: string;
  status: string;
  verification_status: string;
  city?: string | null;
  state?: string | null;
  date_of_birth?: string | null;
  email_verified?: boolean;
  email_verified_at?: string | null;
  agent_license_number?: string | null;
  bank_account_number?: string | null; // masked last 4 from API
  ifsc_code?: string | null;
  account_verified?: boolean;
  rejection_reason?: string | null;
  custom_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Inquiry {
  id: string;
  property_id: string;
  user_id?: string | null;
  assigned_agent_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status?: string;
  inquiry_type?: string | null;
  location?: string | null;
  custom_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  agent_license_number?: string | null;
  city?: string | null;
  state?: string | null;
  profile_image_url?: string | null;
  experience_years?: number;
  user_type: string;
  status: string;
  verification_status: string;
  custom_id?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  entity_type?: string | null;
  entity_id?: string | null;
  user_id?: string | null;
  read?: boolean;
  created_at?: string;
}

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type?: string | null;
  file_size?: number | null;
  entity_type: string;
  entity_id: string;
  document_category?: string | null;
  uploaded_by?: string | null;
  created_at?: string;
}

export interface AgentProfile {
  id: string;
  user_id: string;
  experience_years?: number | null;
  specialization?: string | null;
  bio?: string | null;
  education_background?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AgentInquiryAssignment {
  id: string;
  inquiry_id: string;
  agent_id: string;
  assigned_at?: string;
  expires_at?: string | null;
  responded_at?: string | null;
  status?: string;
  notes?: string | null;
}

export interface EmailVerificationToken {
  id: string;
  user_id?: string | null;
  token: string;
  expires_at: string;
  created_at?: string;
}

export interface SystemCounter {
  id: string;
  prefix: string;
  current_value?: number;
  updated_at?: string;
}

// Export types for compatibility
export type { Property as PropertyType };
export type { Booking as BookingType };
export type { DatabaseUser as UserType };
export type { Agent as AgentType };
export type { Inquiry as InquiryType };
export type { Notification as NotificationType };