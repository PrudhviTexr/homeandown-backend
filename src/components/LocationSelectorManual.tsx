import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import LocationInput from './LocationInput';
import LocationService from '@/services/locationService';
import { pyFetch } from '@/utils/backend';

interface LocationSelectorProps {
  selectedState?: string;
  selectedDistrict?: string;
  selectedMandal?: string;
  onStateChange: (stateId: string) => void;
  onDistrictChange: (districtId: string) => void;
  onMandalChange: (mandalId: string) => void;
  required?: boolean;
  className?: string;
  formData?: any;
  setFormData?: (data: any) => void;
  handleInputChange?: (e: any) => void;
  readOnly?: boolean; // Add readOnly prop for non-editable location fields
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedState = '',
  selectedDistrict = '',
  selectedMandal = '',
  onStateChange,
  onDistrictChange,
  onMandalChange,
  required = false,
  className = '',
  formData,
  setFormData,
  handleInputChange,
  readOnly = false
}) => {
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [mandals, setMandals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Enter zipcode to auto-fill');

  // Support both `state` and `state_id` (and district/mandal variants)
  const effectiveState = formData ? (formData.state ?? formData.state_id ?? selectedState) : selectedState;
  const effectiveDistrict = formData ? (formData.district ?? formData.district_id ?? selectedDistrict) : selectedDistrict;
  const effectiveMandal = formData ? (formData.mandal ?? formData.mandal_id ?? selectedMandal) : selectedMandal;

  // Load initial suggestions
  useEffect(() => {
    loadStates();
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (effectiveState) {
      loadDistricts(effectiveState);
    } else {
      setDistricts([]);
      setMandals([]);
    }
  }, [effectiveState]);

  // Load mandals when district changes
  useEffect(() => {
    if (effectiveDistrict) {
      loadMandals(effectiveState, effectiveDistrict);
    } else {
      setMandals([]);
    }
  }, [effectiveDistrict]);

  const loadStates = async () => {
    try {
      setLoading(true);
      const data = await LocationService.getStates();
      const stateNames = data.map((state: any) => state.name);
      setStates(stateNames);
    } catch (error) {
      console.error('Error loading states:', error);
      setStates([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (stateName: string) => {
    try {
      const data = await LocationService.getCitiesForState(stateName);
      const districtNames = data.map((city: any) => city.name);
      setDistricts(districtNames);
    } catch (error) {
      console.error('Error loading districts:', error);
      setDistricts([]);
    }
  };

  const loadMandals = async (stateName: string, districtName: string) => {
    try {
      // For now, we'll use a simple approach - you can enhance this based on your data structure
      const data = await LocationService.getCitiesForState(stateName);
      const mandalNames = data
        .filter((city: any) => city.name === districtName)
        .map((city: any) => city.name); // You might want to add mandal data to your API
      setMandals(mandalNames);
    } catch (error) {
      console.error('Error loading mandals:', error);
      setMandals([]);
    }
  };

  const handleZipcodeAutoPopulation = async (zipcode: string) => {
    if (!zipcode || zipcode.length !== 6) return;
    
    setIsFetchingLocation(true);
    setLocationStatus('Fetching location data...');
    try {
      console.log('Fetching location data for zipcode:', zipcode);
      const response = await pyFetch(`/api/properties/zipcode/${zipcode}/suggestions`, { useApiKey: false });
      
      if (response && response.suggestions) {
        const { state, district, mandal, city } = response.suggestions;
        setFormData((prev: any) => ({
          ...prev,
          state: state || '',
          district: district || '',
          mandal: mandal || '',
          city: city || '',
          zip_code: zipcode
        }));
      }
    } catch (error) {
      console.error('[LocationSelectorManual] Error fetching zipcode data:', error);
      // Attempt to use fallback data if API fails
      console.log('[LocationSelectorManual] Attempting fallback zipcode lookup...');
      handleFallbackZipcodeLookup(zipcode);
    } finally {
      setIsFetchingLocation(false);
    }
  };
  
  const handleFallbackZipcodeLookup = (zipcode: string) => {
    const fallbackData: { [key: string]: any } = {
        '500090': { state: 'Telangana', district: 'Hyderabad', mandal: 'Serilingampally', city: 'Hyderabad' },
        '500001': { state: 'Telangana', district: 'Hyderabad', mandal: 'Secunderabad', city: 'Hyderabad' },
    };

    const data = fallbackData[zipcode];
    if (data) {
        console.log('[LocationSelectorManual] Using fallback data for zipcode:', zipcode);
        setFormData((prev: any) => ({
            ...prev,
            state: data.state || '',
            district: data.district || '',
            mandal: data.mandal || '',
            city: data.city || '',
            zip_code: zipcode
        }));
    }
  };

  const handleStateChange = (value: string) => {
    if (setFormData) {
      setFormData((prev: any) => {
        if (prev && ('state_id' in prev || 'district_id' in prev || 'mandal_id' in prev)) {
          return { ...prev, state_id: value, district_id: '', mandal_id: '' };
        }
        return { ...prev, state: value, district: '', mandal: '' };
      });
      if (handleInputChange) {
        const name = (formData && ('state_id' in formData)) ? 'state_id' : 'state';
        handleInputChange({ target: { name, value } });
      }
    } else {
      onStateChange(value);
      onDistrictChange('');
      onMandalChange('');
    }
  };

  const handleDistrictChange = (value: string) => {
    if (setFormData) {
      setFormData((prev: any) => {
        if (prev && ('state_id' in prev || 'district_id' in prev || 'mandal_id' in prev)) {
          return { ...prev, district_id: value, mandal_id: '' };
        }
        return { ...prev, district: value, mandal: '' };
      });
      if (handleInputChange) {
        const name = (formData && ('district_id' in formData)) ? 'district_id' : 'district';
        handleInputChange({ target: { name, value } });
      }
    } else {
      onDistrictChange(value);
      onMandalChange('');
    }
  };

  const handleMandalChange = (value: string) => {
    if (setFormData) {
      setFormData((prev: any) => {
        if (prev && ('state_id' in prev || 'district_id' in prev || 'mandal_id' in prev)) {
          return { ...prev, mandal_id: value };
        }
        return { ...prev, mandal: value };
      });
      if (handleInputChange) {
        const name = (formData && ('mandal_id' in formData)) ? 'mandal_id' : 'mandal';
        handleInputChange({ target: { name, value } });
      }
    } else {
      onMandalChange(value);
    }
  };

  const handleNewState = async (value: string) => {
    try {
      // You can add logic here to save new state to database
      console.log('Adding new state:', value);
      // For now, just add to local suggestions
      setStates(prev => [...prev, value]);
    } catch (error) {
      console.error('Error adding new state:', error);
    }
  };

  const handleNewDistrict = async (value: string) => {
    try {
      // You can add logic here to save new district to database
      console.log('Adding new district:', value);
      // For now, just add to local suggestions
      setDistricts(prev => [...prev, value]);
    } catch (error) {
      console.error('Error adding new district:', error);
    }
  };

  const handleNewMandal = async (value: string) => {
    try {
      // You can add logic here to save new mandal to database
      console.log('Adding new mandal:', value);
      // For now, just add to local suggestions
      setMandals(prev => [...prev, value]);
    } catch (error) {
      console.error('Error adding new mandal:', error);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zipcode Input - PRIMARY FIELD (MUST BE FIRST) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zipcode * <span className="text-xs text-gray-500">(Enter zipcode to auto-fill all location fields)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name="zip_code"
            value={formData?.zip_code || ''}
            onInput={(e: React.FormEvent<HTMLInputElement>) => {
              if (readOnly) return;
              const input = e.currentTarget;
              const value = input.value;
              // Explicitly limit to 6 digits - ensure no more than 6 can be entered
              const numericValue = value.replace(/\D/g, '').slice(0, 6);
              
              // Only update if value actually changed
              if (numericValue !== (formData?.zip_code || '')) {
                setFormData((prev: any) => ({ ...prev, zip_code: numericValue }));
                
                // Auto-populate when 6 digits are entered
                if (numericValue.length === 6) {
                  handleZipcodeAutoPopulation(numericValue);
                }
              }
            }}
            onPaste={e => {
              if (readOnly) return;
              e.preventDefault();
              const pastedText = e.clipboardData.getData('text');
              const numericValue = pastedText.replace(/\D/g, '').slice(0, 6);
              setFormData((prev: any) => ({ ...prev, zip_code: numericValue }));
              
              if (numericValue.length === 6) {
                handleZipcodeAutoPopulation(numericValue);
              }
            }}
            onBlur={e => {
              if (readOnly) return;
              const val = e.target.value;
              if (val.length === 6) {
                handleZipcodeAutoPopulation(val);
              }
            }}
            placeholder="Enter 6-digit zipcode"
            maxLength={6}
            disabled={readOnly}
            autoComplete="off"
            spellCheck="false"
            className={`w-full p-2 border border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
          {isFetchingLocation && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0ca5e9]"></div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          ⚡ Enter zipcode first to automatically populate state, district, mandal, city, and address
        </p>
      </div>
      
      {/* Location Fields - AUTO-POPULATED FROM ZIPCODE */}
      <div className="mb-4">
        <div className="flex items-center mb-4">
          <MapPin className="h-5 w-5 text-[#90C641] mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Location Details</h3>
          <span className="text-xs text-gray-500 ml-2">(Auto-populated from zipcode)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* State Input */}
          <LocationInput
            label="State"
            value={effectiveState}
            onChange={handleStateChange}
            placeholder={formData?.zip_code && formData.zip_code.length === 6 ? "Auto-filled from zipcode" : "Enter zipcode first"}
            required={required}
            suggestions={states}
            onNewEntry={handleNewState}
            disabled={readOnly || !formData?.zip_code || formData.zip_code.length < 6}
          />

          {/* District Input */}
          <LocationInput
            label="District"
            value={effectiveDistrict}
            onChange={handleDistrictChange}
            placeholder={effectiveState ? "Auto-filled from zipcode" : "Enter zipcode first"}
            required={required}
            suggestions={districts}
            onNewEntry={handleNewDistrict}
            disabled={readOnly || !effectiveState || !formData?.zip_code || formData.zip_code.length < 6}
          />

          {/* Mandal Input */}
          <LocationInput
            label="Mandal"
            value={effectiveMandal}
            onChange={handleMandalChange}
            placeholder={effectiveDistrict ? "Auto-filled from zipcode" : "Enter zipcode first"}
            required={required}
            suggestions={mandals}
            onNewEntry={handleNewMandal}
            disabled={readOnly || !effectiveDistrict || !formData?.zip_code || formData.zip_code.length < 6}
          />
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
