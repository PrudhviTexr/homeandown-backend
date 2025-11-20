import { useState, useEffect, useCallback } from 'react';
import LocationService from '@/services/locationService';

interface LocationData {
  states: any[];
  districts: any[];
  mandals: any[];
  cities: any[];
}

interface LocationHookReturn {
  locationData: LocationData;
  loading: boolean;
  loadStates: () => Promise<void>;
  loadDistricts: (stateId: string) => Promise<void>;
  loadMandals: (stateId: string, districtId: string) => Promise<void>;
  loadCities: (mandalId: string) => Promise<void>;
  getCoordinatesFromPincode: (pincode: string) => Promise<{ lat: number; lng: number } | null>;
}

export const useLocationData = (): LocationHookReturn => {
  const [locationData, setLocationData] = useState<LocationData>({
    states: [],
    districts: [],
    mandals: [],
    cities: []
  });
  const [loading, setLoading] = useState(false);

  const loadStates = useCallback(async () => {
    try {
      setLoading(true);
      const states = await LocationService.getStates();
      setLocationData(prev => ({ ...prev, states }));
    } catch (error) {
      console.error('Error loading states:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDistricts = useCallback(async (stateId: string) => {
    if (!stateId) return;
    
    try {
      setLoading(true);
      const districts = await LocationService.getDistrictsForState(stateId);
      setLocationData(prev => ({ ...prev, districts, mandals: [], cities: [] }));
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMandals = useCallback(async (stateId: string, districtId: string) => {
    if (!stateId || !districtId) return;
    
    try {
      setLoading(true);
      const mandals = await LocationService.getMandalsForDistrict(stateId, districtId);
      setLocationData(prev => ({ ...prev, mandals, cities: [] }));
    } catch (error) {
      console.error('Error loading mandals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCities = useCallback(async (mandalId: string) => {
    if (!mandalId) return;
    
    try {
      setLoading(true);
      const cities = await LocationService.getCitiesForMandal(mandalId);
      setLocationData(prev => ({ ...prev, cities }));
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCoordinatesFromPincode = useCallback(async (pincode: string) => {
    try {
      const coordinates = await LocationService.getCoordinatesFromPincode(pincode);
      return coordinates;
    } catch (error) {
      console.error('Error getting coordinates from pincode:', error);
      return null;
    }
  }, []);

  // Load states on mount
  useEffect(() => {
    loadStates();
  }, [loadStates]);

  return {
    locationData,
    loading,
    loadStates,
    loadDistricts,
    loadMandals,
    loadCities,
    getCoordinatesFromPincode
  };
};
