export interface Property {
  id: string;
  title: string;
  description: string;
  price: number | null;
  monthly_rent: number | null;
  security_deposit: number | null;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  amenities: string[];
  owner_id: string | null;
  owner_first_name?: string | null;
  owner_last_name?: string | null;
  owner_email?: string | null;
  status: string;
  featured: boolean;
  verified: boolean;
  listing_type: string;
  available_from: string | null;
  furnishing_status: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CityData {
  city: string;
  count: number;
  image: string;
}

import { SUPPORTED_CITIES } from '@/config/cities';
import ApiService from './api';

export class PropertyService {
  static async getFeaturedProperties(): Promise<Property[]> {
    try {
      console.log('[PropertyService] Fetching featured properties...');
      const data = await ApiService.getProperties({ featured: true });
      console.log('[PropertyService] Featured properties received:', Array.isArray(data) ? data.length : 'not an array');
      
      // Ensure data is an array before processing
      if (Array.isArray(data)) {
        return data.slice(0, 4);
      } else {
        console.warn('[PropertyService] getFeaturedProperties received non-array data:', typeof data, data);
        return [];
      }
    } catch (error) {
      console.error('Error in getFeaturedProperties:', error);
      return [];
    }
  }

  static async getCitiesData(): Promise<CityData[]> {
    try {
      console.log('[PropertyService] Fetching cities data...');
      const properties = await ApiService.getProperties();
      console.log('[PropertyService] Total properties for cities:', properties?.length || 0);
      
      // Count properties by city
      const cityCounts = properties?.reduce((acc: any, prop: any) => {
        const city = prop.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {}) || {};
      
      // Create city data with images using our centralized config
      const cityDataWithImages = (SUPPORTED_CITIES || []).map(cityConfig => ({
        city: cityConfig.name,
        count: cityCounts[cityConfig.name] || 0,
        image: cityConfig.image
      }));
      
      console.log('[PropertyService] Cities data prepared:', cityDataWithImages.length);
      return cityDataWithImages;
    } catch (error) {
      console.error('Error in getCitiesData:', error);
      return [];
    }
  }

  static async searchProperties(filters: {
    location?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
  }): Promise<Property[]> {
    try {
      console.log('[PropertyService] Searching properties with filters:', filters);
      
      const searchFilters: any = {};
      
      if (filters.city) searchFilters.city = filters.city;
      if (filters.propertyType) searchFilters.property_type = filters.propertyType;
      if (filters.minPrice) searchFilters.min_price = filters.minPrice;
      if (filters.maxPrice) searchFilters.max_price = filters.maxPrice;

      const data = await ApiService.getProperties(searchFilters);
      console.log('[PropertyService] Search results:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in searchProperties:', error);
      throw error;
    }
  }

  static async getAllProperties(): Promise<Property[]> {
    try {
      console.log('[PropertyService] Fetching all properties...');
      const data = await ApiService.getProperties();
      console.log('[PropertyService] All properties received:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in getAllProperties:', error);
      throw error;
    }
  }

  static async getPropertyById(id: string): Promise<Property | null> {
    try {
      console.log('[PropertyService] Fetching property by ID:', id);
      const data = await ApiService.getProperty(id);
      console.log('[PropertyService] Property by ID result:', data ? 'Found' : 'Not found');
      return data || null;
    } catch (error) {
      console.error('Error in getPropertyById:', error);
      throw error;
    }
  }

  static async getPropertiesByType(listingType: 'SALE' | 'RENT', filters?: any): Promise<Property[]> {
    try {
      console.log('[PropertyService] Fetching properties by type:', listingType, 'with filters:', filters);
      
      const searchFilters: any = { listing_type: listingType };
      
      if (filters?.state) searchFilters.state = filters.state;
      if (filters?.city) searchFilters.city = filters.city;
      if (filters?.propertyType) {
        // Handle multiple property types (comma-separated)
        const propertyTypes = filters.propertyType.split(',').map((type: string) => type.trim());
        if (propertyTypes.length === 1) {
          searchFilters.property_type = propertyTypes[0];
        } else {
          // For multiple types, we'll filter on the frontend
          searchFilters.property_types = propertyTypes;
        }
      }
      if (filters?.commercialSubtype) searchFilters.commercial_subtype = filters.commercialSubtype;
      if (filters?.landType) searchFilters.land_type = filters.landType;
      if (filters?.bedrooms) searchFilters.bedrooms = parseInt(filters.bedrooms);
      if (filters?.bathrooms) searchFilters.bathrooms = parseInt(filters.bathrooms);
      if (filters?.minArea) searchFilters.min_area = parseInt(filters.minArea);
      if (filters?.maxArea) searchFilters.max_area = parseInt(filters.maxArea);
      if (filters?.furnishingStatus) searchFilters.furnishing_status = filters.furnishingStatus;
      if (filters?.facing) searchFilters.facing = filters.facing;
      
      console.log('[PropertyService] Built search filters:', searchFilters);
      console.log('[PropertyService] City filter:', filters?.city, 'State filter:', filters?.state);
      console.log('[PropertyService] Furnishing status filter:', filters?.furnishingStatus);
      console.log('[PropertyService] All filters received:', filters);
      
      if (listingType === 'SALE') {
        if (filters?.minPrice) searchFilters.min_price = parseInt(filters.minPrice);
        if (filters?.maxPrice) searchFilters.max_price = parseInt(filters.maxPrice);
      } else {
        if (filters?.minRent) searchFilters.min_rent = parseInt(filters.minRent);
        if (filters?.maxRent) searchFilters.max_rent = parseInt(filters.maxRent);
      }

      const data = await ApiService.getProperties(searchFilters);
      console.log('[PropertyService] Properties by type result:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in getPropertiesByType:', error);
      throw error;
    }
  }
}