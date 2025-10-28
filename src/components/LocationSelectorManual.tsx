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
  handleInputChange
}) => {
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [mandals, setMandals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

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

  // Pincode auto-population function
  const handlePincodeAutoPopulation = async (pincode: string) => {
    if (!pincode || pincode.length !== 6) return;
    
    try {
      setPincodeLoading(true);
      console.log('[LocationSelector] Fetching location data for pincode:', pincode);
      
      // Call the pincode API endpoint
      const response = await pyFetch(`/api/properties/pincode/${pincode}/suggestions`, { useApiKey: true });
      
      if (response && response.suggestions) {
        const suggestions = response.suggestions;
        console.log('[LocationSelector] Pincode data received:', suggestions);
        
        // Auto-populate location fields
        if (suggestions.state) {
          onStateChange(suggestions.state);
          if (setFormData) {
            setFormData((prev: any) => ({
              ...prev,
              state: suggestions.state,
              state_id: suggestions.state_id || suggestions.state
            }));
          }
        }
        
        if (suggestions.district) {
          onDistrictChange(suggestions.district);
          if (setFormData) {
            setFormData((prev: any) => ({
              ...prev,
              district: suggestions.district,
              district_id: suggestions.district_id || suggestions.district
            }));
          }
        }
        
        if (suggestions.mandal) {
          onMandalChange(suggestions.mandal);
          if (setFormData) {
            setFormData((prev: any) => ({
              ...prev,
              mandal: suggestions.mandal,
              mandal_id: suggestions.mandal_id || suggestions.mandal
            }));
          }
        }
        
        if (suggestions.city && setFormData) {
          setFormData((prev: any) => ({
            ...prev,
            city: suggestions.city
          }));
        }
        
        if (suggestions.address && setFormData) {
          setFormData((prev: any) => ({
            ...prev,
            address: suggestions.address
          }));
        }
        
        if (suggestions.latitude && suggestions.longitude && setFormData) {
          setFormData((prev: any) => ({
            ...prev,
            latitude: suggestions.latitude.toString(),
            longitude: suggestions.longitude.toString()
          }));
        }
        
        console.log('[LocationSelector] Location fields auto-populated successfully');
      }
    } catch (error) {
      console.error('[LocationSelector] Error fetching pincode data:', error);
      
      // Fallback: Try to use a mock API or hardcoded data for common pincodes
      console.log('[LocationSelector] Attempting fallback pincode lookup...');
      await handleFallbackPincodeLookup(pincode);
    } finally {
      setPincodeLoading(false);
    }
  };

  // Fallback pincode lookup for when external API fails
  const handleFallbackPincodeLookup = async (pincode: string) => {
    // Common pincode mappings for testing
    const fallbackData: { [key: string]: any } = {
      '500090': {
        state: 'Telangana',
        district: 'Hyderabad',
        mandal: 'Serilingampally',
        city: 'Hyderabad',
        address: 'Serilingampally, Hyderabad, Telangana',
        latitude: 17.3850,
        longitude: 78.4867
      },
      '500001': {
        state: 'Telangana',
        district: 'Hyderabad',
        mandal: 'Secunderabad',
        city: 'Hyderabad',
        address: 'Secunderabad, Hyderabad, Telangana',
        latitude: 17.4399,
        longitude: 78.4983
      },
      '500002': {
        state: 'Telangana',
        district: 'Hyderabad',
        mandal: 'Khairatabad',
        city: 'Hyderabad',
        address: 'Khairatabad, Hyderabad, Telangana',
        latitude: 17.4065,
        longitude: 78.4772
      },
      '500003': {
        state: 'Telangana',
        district: 'Hyderabad',
        mandal: 'Himayathnagar',
        city: 'Hyderabad',
        address: 'Himayathnagar, Hyderabad, Telangana',
        latitude: 17.4065,
        longitude: 78.4772
      },
      '500004': {
        state: 'Telangana',
        district: 'Hyderabad',
        mandal: 'Abids',
        city: 'Hyderabad',
        address: 'Abids, Hyderabad, Telangana',
        latitude: 17.4065,
        longitude: 78.4772
      }
    };

    const data = fallbackData[pincode];
    if (data) {
      console.log('[LocationSelector] Using fallback data for pincode:', pincode);
      
      // Auto-populate with fallback data
      if (data.state) {
        onStateChange(data.state);
        if (setFormData) {
          setFormData((prev: any) => ({
            ...prev,
            state: data.state,
            state_id: data.state
          }));
        }
      }
      
      if (data.district) {
        onDistrictChange(data.district);
        if (setFormData) {
          setFormData((prev: any) => ({
            ...prev,
            district: data.district,
            district_id: data.district
          }));
        }
      }
      
      if (data.mandal) {
        onMandalChange(data.mandal);
        if (setFormData) {
          setFormData((prev: any) => ({
            ...prev,
            mandal: data.mandal,
            mandal_id: data.mandal
          }));
        }
      }
      
      if (data.city && setFormData) {
        setFormData((prev: any) => ({
          ...prev,
          city: data.city
        }));
      }
      
      if (data.address && setFormData) {
        setFormData((prev: any) => ({
          ...prev,
          address: data.address
        }));
      }
      
      if (data.latitude && data.longitude && setFormData) {
        setFormData((prev: any) => ({
          ...prev,
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString()
        }));
      }
      
      console.log('[LocationSelector] Fallback data applied successfully');
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
      <div className="flex items-center mb-4">
        <MapPin className="h-5 w-5 text-[#90C641] mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Location Details</h3>
      </div>
      
      {/* Pincode Input - Primary Field */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pincode * <span className="text-xs text-gray-500">(Enter pincode to auto-fill all location fields)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            name="zip_code"
            value={formData?.zip_code || ''}
            onChange={(e) => {
              const pincode = e.target.value;
              
              // Only allow numeric input
              const numericPincode = pincode.replace(/\D/g, '');
              
              // Update form data directly without any interference
              if (setFormData) {
                setFormData((prev: any) => ({ ...prev, zip_code: numericPincode }));
              }
              
              // Don't call handleInputChange to avoid any interference
              // Auto-population will happen on blur
            }}
            onBlur={async (e) => {
              const pincode = e.target.value;
              
              // Only auto-populate when pincode is exactly 6 digits and user finishes typing
              if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
                await handlePincodeAutoPopulation(pincode);
              }
            }}
            onKeyDown={(e) => {
              // Allow backspace, delete, tab, escape, enter
              if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                  // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                  (e.keyCode === 65 && e.ctrlKey === true) ||
                  (e.keyCode === 67 && e.ctrlKey === true) ||
                  (e.keyCode === 86 && e.ctrlKey === true) ||
                  (e.keyCode === 88 && e.ctrlKey === true) ||
                  // Allow home, end, left, right
                  (e.keyCode >= 35 && e.keyCode <= 40)) {
                return;
              }
              // Ensure that it is a number and stop the keypress
              if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
              }
            }}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] bg-white"
            required={required}
            autoComplete="off"
            spellCheck="false"
          />
          {pincodeLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0ca5e9]"></div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter pincode first to automatically populate state, district, mandal, city, and address
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* State Input */}
        <LocationInput
          label="State"
          value={effectiveState}
          onChange={handleStateChange}
          placeholder="Enter state name"
          required={required}
          suggestions={states}
          onNewEntry={handleNewState}
        />

        {/* District Input */}
        <LocationInput
          label="District"
          value={effectiveDistrict}
          onChange={handleDistrictChange}
          placeholder="Enter district name"
          required={required}
          suggestions={districts}
          onNewEntry={handleNewDistrict}
        />

        {/* Mandal Input */}
        <LocationInput
          label="Mandal"
          value={effectiveMandal}
          onChange={handleMandalChange}
          placeholder="Enter mandal name"
          required={required}
          suggestions={mandals}
          onNewEntry={handleNewMandal}
        />
      </div>
    </div>
  );
};

export default LocationSelector;
