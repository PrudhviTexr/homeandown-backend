import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useLocationData } from '@/hooks/useLocationData';
import { pyFetch } from '@/utils/backend';

interface LocationSelectorProps {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  handleInputChange?: (e: any) => void;
  required?: boolean;
  className?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  formData,
  setFormData,
  handleInputChange,
  required = false,
  className = ''
}) => {
  const { locationData, loading, loadDistricts, loadMandals, loadCities } = useLocationData();
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Pincode auto-population function
  const handlePincodeAutoPopulation = async (pincode: string) => {
    if (!pincode || pincode.length !== 6) return;
    
    try {
      setPincodeLoading(true);
      console.log('[LocationSelector] Fetching location data for pincode:', pincode);
      
      // Call the pincode API endpoint
      console.log('[LocationSelector] Calling API:', `/api/properties/pincode/${pincode}/suggestions`);
      const response = await pyFetch(`/api/properties/pincode/${pincode}/suggestions`, { useApiKey: true });
      console.log('[LocationSelector] API Response:', response);
      
      if (response && response.suggestions) {
        const suggestions = response.suggestions;
        console.log('[LocationSelector] Pincode data received:', suggestions);
        console.log('[LocationSelector] Suggestions state:', suggestions.state);
        console.log('[LocationSelector] Suggestions district:', suggestions.district);
        console.log('[LocationSelector] Suggestions mandal:', suggestions.mandal);
        console.log('[LocationSelector] Suggestions city:', suggestions.city);
        
        // Update form data with all suggested values first
        if (setFormData) {
          setFormData((prev: any) => ({
            ...prev,
            state: suggestions.state || prev.state,
            district: suggestions.district || prev.district,
            mandal: suggestions.mandal || prev.mandal,
            city: suggestions.city || prev.city,
            address: suggestions.address || prev.address,
            latitude: suggestions.latitude?.toString() || prev.latitude,
            longitude: suggestions.longitude?.toString() || prev.longitude
          }));
        }
        
        // Set dropdown selections directly - this will work with fallback data
        if (suggestions.state) {
          setSelectedState(suggestions.state);
          onStateChange(suggestions.state);
        }
        
        if (suggestions.district) {
          setSelectedDistrict(suggestions.district);
          onDistrictChange(suggestions.district);
        }
        
        if (suggestions.mandal) {
          setSelectedMandal(suggestions.mandal);
          onMandalChange(suggestions.mandal);
        }
        
        if (suggestions.city) {
          setSelectedCity(suggestions.city);
        }
        
        console.log('[LocationSelector] Location fields auto-populated successfully');
      }
    } catch (error) {
      console.error('[LocationSelector] Error fetching pincode data:', error);
      
      // Fallback: Use hardcoded data for common pincodes
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
      
      // Update form data with fallback data first
      if (setFormData) {
        setFormData((prev: any) => ({
          ...prev,
          state: data.state || prev.state,
          district: data.district || prev.district,
          mandal: data.mandal || prev.mandal,
          city: data.city || prev.city,
          address: data.address || prev.address,
          latitude: data.latitude?.toString() || prev.latitude,
          longitude: data.longitude?.toString() || prev.longitude
        }));
      }
      
      // Set dropdown selections directly
      if (data.state) {
        setSelectedState(data.state);
        onStateChange(data.state);
      }
      
      if (data.district) {
        setSelectedDistrict(data.district);
        onDistrictChange(data.district);
      }
      
      if (data.mandal) {
        setSelectedMandal(data.mandal);
        onMandalChange(data.mandal);
      }
      
      if (data.city) {
        setSelectedCity(data.city);
      }
      
      console.log('[LocationSelector] Fallback data applied successfully');
    }
  };
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Initialize from formData
  useEffect(() => {
    if (formData) {
      setSelectedState(formData.state_id || formData.state || '');
      setSelectedDistrict(formData.district_id || formData.district || '');
      setSelectedMandal(formData.mandal_id || formData.mandal || '');
      setSelectedCity(formData.city_id || formData.city || '');
    } else {
      // Reset all selections when formData is empty/null
      setSelectedState('');
      setSelectedDistrict('');
      setSelectedMandal('');
      setSelectedCity('');
    }
  }, [formData]);

  // Reset component state when component unmounts or when formData is cleared
  useEffect(() => {
    return () => {
      // Cleanup function - reset state when component unmounts
      setSelectedState('');
      setSelectedDistrict('');
      setSelectedMandal('');
      setSelectedCity('');
    };
  }, []);

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedDistrict('');
    setSelectedMandal('');
    setSelectedCity('');
    
    setFormData((prev: any) => ({
      ...prev,
      state_id: value,
      district_id: '',
      mandal_id: '',
      city_id: '',
      state: value,
      district: '',
      mandal: '',
      city: ''
    }));

    if (value) {
      loadDistricts(value);
    }
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedMandal('');
    setSelectedCity('');
    
    setFormData((prev: any) => ({
      ...prev,
      district_id: value,
      mandal_id: '',
      city_id: '',
      district: value,
      mandal: '',
      city: ''
    }));

    if (value && selectedState) {
      loadMandals(selectedState, value);
    }
  };

  const handleMandalChange = (value: string) => {
    setSelectedMandal(value);
    setSelectedCity('');
    
    setFormData((prev: any) => ({
      ...prev,
      mandal_id: value,
      city_id: '',
      mandal: value,
      city: ''
    }));

    if (value) {
      loadCities(value);
    }
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    
    setFormData((prev: any) => ({
      ...prev,
      city_id: value,
      city: value
    }));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center mb-4">
        <MapPin className="h-5 w-5 text-[#90C641] mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Location Details</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* State Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              required={required}
            >
              <option value="">Select State</option>
              {locationData.states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>

        {/* District Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              required={required}
              disabled={!selectedState || loading}
            >
              <option value="">Select District</option>
              {locationData.districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>

        {/* Mandal Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mandal {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select
              value={selectedMandal}
              onChange={(e) => handleMandalChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              required={required}
              disabled={!selectedDistrict || loading}
            >
              <option value="">Select Mandal</option>
              {locationData.mandals.map((mandal) => (
                <option key={mandal.id} value={mandal.id}>
                  {mandal.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>

        {/* City Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              required={required}
              disabled={!selectedMandal || loading}
            >
              <option value="">Select City</option>
              {locationData.cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>
      </div>

      {/* Pincode Field - Primary Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pincode * <span className="text-xs text-gray-500">(Enter pincode to auto-fill all location fields)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            name="zip_code"
            value={formData.zip_code || ''}
            onChange={(e) => {
              const pincode = e.target.value;
              
              // Only allow numeric input
              const numericPincode = pincode.replace(/\D/g, '');
              
              // Update form data directly without any interference
              if (setFormData) {
                setFormData((prev: any) => ({
                  ...prev,
                  zip_code: numericPincode
                }));
              }
              
              // Don't call handleInputChange to avoid any interference
              // Auto-population will happen on blur
            }}
            onBlur={async (e) => {
              const pincode = e.target.value;
              
              // Only auto-populate when pincode is exactly 6 digits and user finishes typing
              if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
                await handlePincodeAutoPopulation(pincode);
              } else if (pincode.length < 6) {
                // Clear dropdowns if pincode is incomplete
                setSelectedState('');
                setSelectedDistrict('');
                setSelectedMandal('');
                setSelectedCity('');
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

      {/* Additional Location Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter full address"
          />
        </div>
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            name="latitude"
            value={formData.latitude || ''}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter latitude"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            name="longitude"
            value={formData.longitude || ''}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter longitude"
          />
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;