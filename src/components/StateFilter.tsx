import React, { useState, useEffect } from 'react';
import LocationService from '@/services/locationService';

interface StateFilterProps {
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  selectedState?: string;
  selectedCity?: string;
  className?: string;
}

const StateFilter: React.FC<StateFilterProps> = ({
  onStateChange,
  onCityChange,
  selectedState = '',
  selectedCity = '',
  className = ''
}) => {
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug logging
  console.log('[StateFilter] Props received:', { selectedState, selectedCity });

  // Fetch states and cities from database
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        setLoading(true);
        const statesData = await LocationService.getStates();
        // Extract state names from objects or use as strings
        const stateNames = statesData.map(state => 
          typeof state === 'string' ? state : state.name || state
        );
        setAvailableStates(stateNames);
        console.log('[StateFilter] Available states from DB:', stateNames);
      } catch (error) {
        console.error('[StateFilter] Error fetching states:', error);
        // Fallback to static data
        setAvailableStates(['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Delhi', 'West Bengal']);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
  }, []);

  // Update available cities when state changes
  useEffect(() => {
    const fetchCitiesForState = async () => {
      if (selectedState) {
        try {
          const citiesData = await LocationService.getCitiesForState(selectedState);
          // Extract city names from objects or use as strings
          const cityNames = citiesData.map(city => 
            typeof city === 'string' ? city : city.name || city
          );
          console.log('[StateFilter] Cities in state from DB:', cityNames);
          setAvailableCities(cityNames);
        } catch (error) {
          console.error('[StateFilter] Error fetching cities:', error);
          setAvailableCities([]);
        }
      } else {
        setAvailableCities([]);
      }
    };

    fetchCitiesForState();
  }, [selectedState]);

  // Clear city if it's not valid for the selected state
  useEffect(() => {
    if (selectedState && selectedCity && availableCities.length > 0 && !availableCities.includes(selectedCity)) {
      onCityChange('');
    }
  }, [selectedState, selectedCity, availableCities, onCityChange]);

  const handleStateChange = (state: string) => {
    console.log('[StateFilter] State changed to:', state);
    console.log('[StateFilter] Calling onStateChange with:', state);
    onStateChange(state);
    // Don't reset city immediately - let the parent component handle it
    // The city will be cleared by the useEffect in the parent component
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        <div className="w-full p-3 rounded-lg border border-gray-300 bg-gray-100 animate-pulse">
          Loading states...
        </div>
        <div className="w-full p-3 rounded-lg border border-gray-300 bg-gray-100 animate-pulse">
          Loading cities...
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* State Filter */}
      <select
        value={selectedState}
        onChange={(e) => handleStateChange(e.target.value)}
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] bg-white"
      >
        <option value="">Select State</option>
        {availableStates.map(state => (
          <option key={state} value={state}>{state}</option>
        ))}
      </select>

      {/* City Filter */}
      <select
        value={selectedCity}
        onChange={(e) => {
          console.log('[StateFilter] City changed to:', e.target.value);
          console.log('[StateFilter] Calling onCityChange with:', e.target.value);
          onCityChange(e.target.value);
        }}
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] bg-white disabled:opacity-50"
        disabled={!selectedState}
      >
        <option value="">
          {selectedState ? `Select City in ${selectedState}` : 'Select State First'}
        </option>
        {availableCities.map(city => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
    </div>
  );
};

export default StateFilter;