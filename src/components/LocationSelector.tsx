import React, { useState, useEffect, useRef } from 'react';
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
  const [zipcodeLoading, setZipcodeLoading] = useState(false);
  const zipcodeInputRef = useRef<HTMLInputElement>(null);
  const previousZipcodeLengthRef = useRef<number>(0);

  // Zipcode auto-population function
  const handleZipcodeAutoPopulation = async (zipcode: string) => {
    if (!zipcode || zipcode.length !== 6 || !/^\d{6}$/.test(zipcode)) return;
    
    try {
      setZipcodeLoading(true);
      console.log('[LocationSelector] Fetching location data for zipcode:', zipcode);
      
      // Call the zipcode API endpoint (tries zipcode first, falls back to pincode for backward compatibility)
      console.log('[LocationSelector] Calling API:', `/api/properties/zipcode/${zipcode}/suggestions`);
      const response = await pyFetch(`/api/properties/zipcode/${zipcode}/suggestions`, { useApiKey: false });
      console.log('[LocationSelector] API Response:', response);
      
      if (response && response.suggestions) {
        const suggestions = response.suggestions;
        const mapData = response.map_data;
        
        console.log('[LocationSelector] Zipcode data received:', suggestions);
        console.log('[LocationSelector] Map data:', mapData);
        
        // Extract coordinates from map_data if available, otherwise use suggestions
        const latitude = mapData?.coordinates?.lat || suggestions.latitude || mapData?.coordinates?.[0] || suggestions.latitude;
        const longitude = mapData?.coordinates?.lng || suggestions.longitude || mapData?.coordinates?.[1] || suggestions.longitude;
        
        // Update form data with all suggested values including GPS coordinates
        if (setFormData) {
          setFormData((prev: any) => ({
            ...prev,
            state: suggestions.state || prev.state,
            district: suggestions.district || prev.district,
            mandal: suggestions.mandal || prev.mandal,
            city: suggestions.city || prev.city,
            address: suggestions.address || prev.address,
            latitude: latitude ? latitude.toString() : prev.latitude,
            longitude: longitude ? longitude.toString() : prev.longitude,
            zip_code: zipcode // Ensure zipcode is preserved
          }));
        }
        
        // Set dropdown selections directly and load dependent data
        if (suggestions.state) {
          setSelectedState(suggestions.state);
          handleStateChange(suggestions.state);
          
          // Load districts for this state
          if (loadDistricts) {
            loadDistricts(suggestions.state);
          }
          
          // After districts load, set district and load mandals
          if (suggestions.district) {
            setTimeout(() => {
              setSelectedDistrict(suggestions.district);
              handleDistrictChange(suggestions.district);
              
              // Load mandals for this district
              if (loadMandals && suggestions.state) {
                loadMandals(suggestions.state, suggestions.district);
                
                // After mandals load, set mandal and load cities
                if (suggestions.mandal) {
                  setTimeout(() => {
                    setSelectedMandal(suggestions.mandal);
                    handleMandalChange(suggestions.mandal);
                    
                    // Load cities for this mandal
                    if (loadCities) {
                      loadCities(suggestions.mandal);
                    }
                    
                    // Set city
                    if (suggestions.city) {
                      setTimeout(() => {
                        setSelectedCity(suggestions.city);
                        handleCityChange(suggestions.city);
                      }, 200);
                    }
                  }, 300);
                }
              }
            }, 300);
          }
        } else {
          // Even if no state, set the other fields
          if (suggestions.district) {
            setSelectedDistrict(suggestions.district);
          }
          if (suggestions.mandal) {
            setSelectedMandal(suggestions.mandal);
          }
          if (suggestions.city) {
            setSelectedCity(suggestions.city);
            handleCityChange(suggestions.city);
          }
        }
        
        console.log('[LocationSelector] Location fields auto-populated successfully');
      }
    } catch (error) {
      console.error('[LocationSelector] Error fetching zipcode data:', error);
      
      // Fallback: Use hardcoded data for common zipcodes
      console.log('[LocationSelector] Attempting fallback zipcode lookup...');
      await handleFallbackZipcodeLookup(zipcode);
    } finally {
      setZipcodeLoading(false);
    }
  };

  // Fallback zipcode lookup for when external API fails
  const handleFallbackZipcodeLookup = async (zipcode: string) => {
    // Common zipcode mappings for testing
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

    const data = fallbackData[zipcode];
    if (data) {
      console.log('[LocationSelector] Using fallback data for zipcode:', zipcode);
      
      // Update form data with fallback data first
      if (setFormData) {
        setFormData((prev: any) => ({
          ...prev,
          state: data.state || prev.state,
          district: data.district || prev.district,
          mandal: data.mandal || prev.mandal,
          city: data.city || prev.city,
          address: data.address || prev.address,
          latitude: data.latitude ? data.latitude.toString() : prev.latitude,
          longitude: data.longitude ? data.longitude.toString() : prev.longitude,
          zip_code: zipcode // Ensure zipcode is preserved
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
      {/* Zipcode Field - PRIMARY INPUT (MUST BE FIRST) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zipcode * <span className="text-xs text-gray-500">(Enter zipcode to auto-fill all location fields)</span>
        </label>
        <div className="relative">
          <input
            ref={zipcodeInputRef}
            type="text"
            name="zip_code"
            value={formData.zip_code || ''}
            onChange={(e) => {
              const zipcode = e.target.value;
              
              // Only allow numeric input
              const numericZipcode = zipcode.replace(/\D/g, '').slice(0, 6); // Limit to 6 digits
              
              // Save cursor position before state update
              const input = e.target as HTMLInputElement;
              const cursorPosition = input.selectionStart || 0;
              const newCursorPosition = Math.min(cursorPosition, numericZipcode.length);
              
              // Update form data
              if (setFormData) {
                setFormData((prev: any) => ({
                  ...prev,
                  zip_code: numericZipcode
                }));
              }
              
              // Restore cursor position after state update
              setTimeout(() => {
                if (zipcodeInputRef.current) {
                  zipcodeInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
                }
              }, 0);
              
              // Auto-populate when exactly 6 digits are entered
              const previousLength = previousZipcodeLengthRef.current;
              previousZipcodeLengthRef.current = numericZipcode.length;
              
              if (numericZipcode.length === 6 && /^\d{6}$/.test(numericZipcode) && previousLength !== 6) {
                // Only trigger if we just reached 6 digits (not if already 6)
                handleZipcodeAutoPopulation(numericZipcode);
              } else if (numericZipcode.length < 6) {
                // Clear dropdowns if zipcode is incomplete
                setSelectedState('');
                setSelectedDistrict('');
                setSelectedMandal('');
                setSelectedCity('');
              }
            }}
            onBlur={async (e) => {
              const zipcode = e.target.value;
              
              // Auto-populate on blur if we have 6 digits (in case onChange didn't fire)
              if (zipcode.length === 6 && /^\d{6}$/.test(zipcode)) {
                await handleZipcodeAutoPopulation(zipcode);
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
            placeholder="Enter 6-digit zipcode"
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] bg-white"
            required={required}
            autoComplete="off"
            spellCheck="false"
          />
            {zipcodeLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0ca5e9]"></div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          ⚡ Enter zipcode first to automatically populate state, district, mandal, city, and address
        </p>
      </div>

      {/* Location Dropdowns - AUTO-POPULATED FROM ZIPCODE */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <MapPin className="mr-2" size={18} />
          Location Details <span className="text-xs text-gray-500 ml-2">(Auto-populated from zipcode)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* State Dropdown */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              disabled={!formData.zip_code || formData.zip_code.length < 6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] bg-white appearance-none pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{formData.zip_code && formData.zip_code.length === 6 ? (formData.state || "Auto-filled") : "Enter zipcode first"}</option>
              {locationData.states.map((state) => (
                <option key={state.id} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>

          {/* District Input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">District</label>
            <input
              type="text"
              name="district"
              value={formData.district || ''}
              onChange={handleInputChange}
              disabled={!formData.zip_code || formData.zip_code.length < 6}
              placeholder={selectedState ? "Auto-filled" : "Select state first"}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Mandal Input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mandal</label>
            <input
              type="text"
              name="mandal"
              value={formData.mandal || ''}
              onChange={handleInputChange}
              disabled={!formData.zip_code || formData.zip_code.length < 6}
              placeholder={selectedDistrict ? "Auto-filled" : "Enter district first"}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* City Input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city || ''}
              onChange={handleInputChange}
              disabled={!formData.zip_code || formData.zip_code.length < 6}
              placeholder={selectedMandal ? "Auto-filled" : "Enter mandal first"}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
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