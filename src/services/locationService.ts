/**
 * Location Service
 * Fetches states, districts, mandals, cities, and pincodes from the database
 */

import { pyFetch } from '@/utils/backend';

export interface LocationData {
  states: any[];
  districts: any[];
  mandals: any[];
  cities: any[];
  pincodes: string[];
}

export interface State {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  state_id: string;
}

export interface Mandal {
  id: string;
  name: string;
  district_id: string;
  state_id: string;
}

export interface City {
  id: string;
  name: string;
  mandal_id: string;
  district_id: string;
  state_id: string;
}

class LocationService {
  private static instance: LocationService;
  private locationData: LocationData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Fetch states from the database
   */
  async getStates(): Promise<any[]> {
    try {
      console.log('[LocationService] Fetching states...');
      const states = await pyFetch('/api/locations/states', { useApiKey: true });
      console.log('[LocationService] States fetched:', states?.length || 0);
      return states || [];
    } catch (error) {
      console.error('[LocationService] Error fetching states:', error);
      // Return fallback states
      return [
        { id: '1', name: 'Andhra Pradesh' },
        { id: '2', name: 'Telangana' },
        { id: '3', name: 'Karnataka' },
        { id: '4', name: 'Tamil Nadu' },
        { id: '5', name: 'Maharashtra' },
        { id: '6', name: 'Delhi' },
        { id: '7', name: 'West Bengal' }
      ];
    }
  }

  /**
   * Get districts for a specific state
   */
  async getDistrictsForState(stateId: string): Promise<any[]> {
    try {
      console.log('[LocationService] Fetching districts for state:', stateId);
      const districts = await pyFetch(`/api/locations/districts?state_id=${stateId}`, { useApiKey: true });
      console.log('[LocationService] Districts fetched:', districts?.length || 0);
      return districts || [];
    } catch (error) {
      console.error('[LocationService] Error fetching districts:', error);
      return [];
    }
  }

  /**
   * Get mandals for a specific district
   */
  async getMandalsForDistrict(stateId: string, districtId: string): Promise<any[]> {
    try {
      console.log('[LocationService] Fetching mandals for district:', districtId);
      const mandals = await pyFetch(`/api/locations/mandals?state_id=${stateId}&district_id=${districtId}`, { useApiKey: true });
      console.log('[LocationService] Mandals fetched:', mandals?.length || 0);
      return mandals || [];
    } catch (error) {
      console.error('[LocationService] Error fetching mandals:', error);
      return [];
    }
  }

  /**
   * Get cities for a specific mandal
   */
  async getCitiesForMandal(mandalId: string): Promise<any[]> {
    try {
      console.log('[LocationService] Fetching cities for mandal:', mandalId);
      const cities = await pyFetch(`/api/locations/cities?mandal_id=${mandalId}`, { useApiKey: true });
      console.log('[LocationService] Cities fetched:', cities?.length || 0);
      return cities || [];
    } catch (error) {
      console.error('[LocationService] Error fetching cities:', error);
      return [];
    }
  }

  /**
   * Get coordinates from pincode
   */
  async getCoordinatesFromPincode(pincode: string): Promise<{ lat: number; lng: number } | null> {
    try {
      console.log('[LocationService] Fetching coordinates for pincode:', pincode);
      const coordinates = await pyFetch(`/api/locations/coordinates?pincode=${pincode}`, { useApiKey: true });
      if (coordinates && coordinates.lat && coordinates.lng) {
        return { lat: coordinates.lat, lng: coordinates.lng };
      }
      return null;
    } catch (error) {
      console.error('[LocationService] Error fetching coordinates:', error);
      return null;
    }
  }

  /**
   * Fetch location data from the database (legacy method for backward compatibility)
   */
  async fetchLocationData(): Promise<LocationData> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.locationData && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.locationData;
    }

    try {
      // Fetch properties to extract unique states and cities
      const properties = await pyFetch('/api/properties', { method: 'GET', useApiKey: false });
      
      const states = new Set<string>();
      const citiesByState: { [state: string]: Set<string> } = {};
      const pincodes = new Set<string>();

      // Process each property to extract location data
      properties.forEach((property: any) => {
        // Extract state
        if (property.state && property.state.trim()) {
          const state = property.state.trim();
          states.add(state);
          
          // Initialize cities set for this state if not exists
          if (!citiesByState[state]) {
            citiesByState[state] = new Set<string>();
          }
        }

        // Extract city
        if (property.city && property.city.trim()) {
          const city = property.city.trim();
          const state = property.state?.trim();
          if (state && citiesByState[state]) {
            citiesByState[state].add(city);
          }
        }

        // Extract pincode
        if (property.zip_code && property.zip_code.trim()) {
          pincodes.add(property.zip_code.trim());
        }
      });

      // Convert sets to arrays and sort
      const sortedStates = Array.from(states).sort();
      const sortedCitiesByState: { [state: string]: string[] } = {};
      
      Object.keys(citiesByState).forEach(state => {
        sortedCitiesByState[state] = Array.from(citiesByState[state]).sort();
      });

      const sortedPincodes = Array.from(pincodes).sort();

      this.locationData = {
        states: sortedStates.map((name, index) => ({ id: String(index + 1), name })),
        districts: [],
        mandals: [],
        cities: Object.values(sortedCitiesByState).flat().map((name, index) => ({ id: String(index + 1), name })),
        pincodes: sortedPincodes
      };

      this.lastFetch = now;
      
      console.log('[LocationService] Fetched location data:', {
        states: sortedStates.length,
        citiesByState: Object.keys(sortedCitiesByState).length,
        pincodes: sortedPincodes.length
      });

      return this.locationData;
    } catch (error) {
      console.error('[LocationService] Error fetching location data:', error);
      
      // Return fallback data if fetch fails
      return {
        states: [
          { id: '1', name: 'Andhra Pradesh' },
          { id: '2', name: 'Telangana' },
          { id: '3', name: 'Karnataka' },
          { id: '4', name: 'Tamil Nadu' },
          { id: '5', name: 'Maharashtra' },
          { id: '6', name: 'Delhi' },
          { id: '7', name: 'West Bengal' }
        ],
        districts: [],
        mandals: [],
        cities: [
          { id: '1', name: 'Visakhapatnam' },
          { id: '2', name: 'Vijayawada' },
          { id: '3', name: 'Hyderabad' },
          { id: '4', name: 'Bangalore' },
          { id: '5', name: 'Chennai' },
          { id: '6', name: 'Mumbai' }
        ],
        pincodes: ['500033', '500034', '500045', '400050', '110049', '535270']
      };
    }
  }

  /**
   * Get cities for a specific state (legacy method)
   */
  async getCitiesForState(state: string): Promise<string[]> {
    const data = await this.fetchLocationData();
    return data.cities.filter(city => city.name).map(city => city.name);
  }

  /**
   * Get all available pincodes
   */
  async getPincodes(): Promise<string[]> {
    const data = await this.fetchLocationData();
    return data.pincodes;
  }

  /**
   * Search pincodes by partial match
   */
  async searchPincodes(query: string): Promise<string[]> {
    const pincodes = await this.getPincodes();
    if (!query) return pincodes.slice(0, 10); // Return first 10 if no query
    
    return pincodes
      .filter(pincode => pincode.startsWith(query))
      .slice(0, 10);
  }

  /**
   * Clear cache to force refresh
   */
  clearCache(): void {
    this.locationData = null;
    this.lastFetch = 0;
  }
}

// Export both the class and the instance for flexibility
export { LocationService };
export default LocationService.getInstance();
