import React, { useState, useEffect, useRef, startTransition } from 'react';
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
  // Local state for zipcode input to prevent re-renders on every keystroke
  const [localZipcode, setLocalZipcode] = useState(() => formData?.zip_code || '');
  // Ref to track last processed zipcode to prevent duplicate API calls
  const lastProcessedZipcodeRef = useRef<string>('');
  // Ref to prevent multiple simultaneous API calls
  const isProcessingZipcodeRef = useRef<boolean>(false);
  // Simple cache for pincode data to speed up repeated lookups
  const pincodeCacheRef = useRef<Map<string, any>>(new Map());
  // Refs to prevent multiple calls to location data loaders
  const lastLoadedStateRef = useRef<string>('');
  const lastLoadedDistrictRef = useRef<string>('');
  const lastLoadedMandalRef = useRef<string>('');

  // Zipcode auto-population function - only called when zipcode is complete (6 digits)
  const handleZipcodeAutoPopulation = async (zipcode: string) => {
    // Validate zipcode format
    if (!zipcode || zipcode.length !== 6 || !/^\d{6}$/.test(zipcode)) {
      console.log('[LocationSelector] Invalid zipcode format, skipping:', zipcode);
      return;
    }
    
    // Prevent duplicate API calls for the same zipcode
    if (isProcessingZipcodeRef.current) {
      console.log('[LocationSelector] Already processing zipcode, skipping:', zipcode);
      return;
    }
    
    // Skip if we just processed this exact zipcode (prevents re-fetching on blur after Enter)
    if (lastProcessedZipcodeRef.current === zipcode && zipcode.length === 6) {
      console.log('[LocationSelector] Zipcode already processed, skipping:', zipcode);
      return;
    }
    
    // Reset all location loader refs to force fresh data loading
    lastLoadedStateRef.current = '';
    lastLoadedDistrictRef.current = '';
    lastLoadedMandalRef.current = '';
    stateChangeRef.current = '';
    districtChangeRef.current = '';
    mandalChangeRef.current = '';
    
    // Prevent multiple simultaneous API calls
    if (isProcessingZipcodeRef.current) {
      console.log('[LocationSelector] Already processing zipcode, skipping:', zipcode);
      return;
    }
    
    // Check cache first for faster response
    const cachedData = pincodeCacheRef.current.get(zipcode);
    if (cachedData) {
      console.log('[LocationSelector] Using cached data for zipcode:', zipcode);
      // Use cached data immediately
      const suggestions = cachedData.suggestions;
      const mapData = cachedData.map_data;
      
      // Update form data with cached location fields
      if (setFormData) {
        const prevZipcode = formData?.zip_code || '';
        const isNewZipcode = prevZipcode !== zipcode;
        
        // Extract coordinates from map_data (can be tuple [lat, lng] or object {lat, lng})
        let lat = '';
        let lng = '';
        
        if (mapData?.coordinates) {
          if (Array.isArray(mapData.coordinates)) {
            lat = mapData.coordinates[0] || '';
            lng = mapData.coordinates[1] || '';
          } else if (typeof mapData.coordinates === 'object') {
            lat = mapData.coordinates.lat || mapData.coordinates.latitude || '';
            lng = mapData.coordinates.lng || mapData.coordinates.longitude || '';
          }
        }
        
        // Fallback to suggestions or map_data direct fields
        if (!lat) {
          lat = mapData?.latitude || suggestions.latitude || '';
        }
        if (!lng) {
          lng = mapData?.longitude || suggestions.longitude || '';
        }
        
        setFormData((prev: any) => ({
          ...prev,
          state: suggestions.state || '',
          district: suggestions.district || '',
          mandal: suggestions.mandal || '',
          city: suggestions.city || '',
          zip_code: zipcode,
          // DO NOT auto-populate address - it's a user entry field
          // address field should remain unchanged (user will type it)
          // Set coordinates from map_data (ALWAYS update coordinates from pincode)
          latitude: lat || '',
          longitude: lng || ''
        }));
        
        console.log('[LocationSelector] Updated form with coordinates:', { lat, lng });
        
        // Update local zipcode state immediately
        setLocalZipcode(zipcode);
      }
      
      // Update ALL fields in a SINGLE batch to prevent blinking/flickering (cached data path)
      startTransition(() => {
        // Update all dropdown states simultaneously
        if (suggestions.state) {
          lastLoadedStateRef.current = suggestions.state;
          stateChangeRef.current = suggestions.state;
          setSelectedState(suggestions.state);
        } else {
          setSelectedState('');
        }
        
        if (suggestions.district) {
          lastLoadedDistrictRef.current = suggestions.district;
          districtChangeRef.current = suggestions.district;
          setSelectedDistrict(suggestions.district);
        } else {
          setSelectedDistrict('');
        }
        
        if (suggestions.mandal) {
          lastLoadedMandalRef.current = suggestions.mandal;
          mandalChangeRef.current = suggestions.mandal;
          setSelectedMandal(suggestions.mandal);
        } else {
          setSelectedMandal('');
        }
        
        if (suggestions.city) {
          setSelectedCity(suggestions.city);
        } else {
          setSelectedCity('');
        }
        
        // Extract coordinates first
        let lat = '';
        let lng = '';
        
        if (mapData?.coordinates) {
          if (Array.isArray(mapData.coordinates)) {
            lat = mapData.coordinates[0] || '';
            lng = mapData.coordinates[1] || '';
          } else if (typeof mapData.coordinates === 'object') {
            lat = mapData.coordinates.lat || mapData.coordinates.latitude || '';
            lng = mapData.coordinates.lng || mapData.coordinates.longitude || '';
          }
        }
        
        // Fallback to suggestions or map_data direct fields
        if (!lat) {
          lat = mapData?.latitude || suggestions.latitude || '';
        }
        if (!lng) {
          lng = mapData?.longitude || suggestions.longitude || '';
        }
        
        // Update formData with ALL location fields at once (no sequential updates)
        // DO NOT update address - it's a user entry field
        if (setFormData) {
          setFormData((prev: any) => ({
            ...prev,
            state: suggestions.state || '',
            district: suggestions.district || '',
            mandal: suggestions.mandal || '',
            city: suggestions.city || '', // Ensure city is set
            zip_code: zipcode,
            // DO NOT auto-populate address - preserve existing or leave empty
            // address: prev.address, // Keep existing address or empty
            // Set coordinates from map_data (for map centering on pincode)
            latitude: lat || prev.latitude || '',
            longitude: lng || prev.longitude || ''
          }));
        }
        
        // Note: City is already set in formData above, no need to call handleCityChange again
        // This prevents duplicate updates and flickering
      });
      
      // Load dependent dropdown data in background (for dropdown options only)
      // Use a longer delay to ensure all field updates are complete and rendered
      // This prevents flickering by ensuring dropdown loading happens after UI settles
      setTimeout(() => {
        if (suggestions.state) {
          // Load districts for dropdown options (async, doesn't block UI)
          // Note: Field values are already set from API, this is just for dropdown options
          loadDistricts(suggestions.state).then(() => {
            if (suggestions.district) {
              loadMandals(suggestions.state, suggestions.district).then(() => {
                if (suggestions.mandal) {
                  loadCities(suggestions.mandal);
                }
              });
            }
          });
        }
      }, 500); // Longer delay to ensure UI has fully settled and no flickering occurs
      
      lastProcessedZipcodeRef.current = zipcode;
      return; // Exit early with cached data
    }
    
    try {
      isProcessingZipcodeRef.current = true;
      lastProcessedZipcodeRef.current = zipcode;
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
        
        // DO NOT extract coordinates from pincode - coordinates come ONLY from map
        // The map will be updated by MapPicker when it detects the pincode change
        
        // Extract coordinates first (before any state updates)
        let lat = '';
        let lng = '';
        
        if (mapData?.coordinates) {
          if (Array.isArray(mapData.coordinates)) {
            lat = mapData.coordinates[0] || '';
            lng = mapData.coordinates[1] || '';
          } else if (typeof mapData.coordinates === 'object') {
            lat = mapData.coordinates.lat || mapData.coordinates.latitude || '';
            lng = mapData.coordinates.lng || mapData.coordinates.longitude || '';
          }
        }
        
        // Fallback to suggestions or map_data direct fields
        if (!lat) {
          lat = mapData?.latitude || suggestions.latitude || '';
        }
        if (!lng) {
          lng = mapData?.longitude || suggestions.longitude || '';
        }
        
        // SINGLE batched update - ALL fields and dropdown states in ONE startTransition
        // This prevents flickering by ensuring everything updates simultaneously
        startTransition(() => {
          const prevZipcode = formData?.zip_code || '';
          const isNewZipcode = prevZipcode !== zipcode;
          
          // Update all dropdown states simultaneously (no sequential updates)
          if (suggestions.state) {
            lastLoadedStateRef.current = suggestions.state;
            stateChangeRef.current = suggestions.state;
            setSelectedState(suggestions.state);
          } else {
            setSelectedState('');
          }
          
          if (suggestions.district) {
            lastLoadedDistrictRef.current = suggestions.district;
            districtChangeRef.current = suggestions.district;
            setSelectedDistrict(suggestions.district);
          } else {
            setSelectedDistrict('');
          }
          
          if (suggestions.mandal) {
            lastLoadedMandalRef.current = suggestions.mandal;
            mandalChangeRef.current = suggestions.mandal;
            setSelectedMandal(suggestions.mandal);
          } else {
            setSelectedMandal('');
          }
          
          if (suggestions.city) {
            setSelectedCity(suggestions.city);
          } else {
            setSelectedCity('');
          }
          
          // Update formData with ALL location fields at once (no sequential updates)
          if (setFormData) {
            setFormData((prev: any) => {
              const newState = suggestions.state || '';
              const newDistrict = suggestions.district || '';
              const newMandal = suggestions.mandal || '';
              const newCity = suggestions.city || '';
              
              // Check if update is needed (prevent unnecessary re-renders)
              if (prev.state === newState && 
                  prev.district === newDistrict && 
                  prev.mandal === newMandal && 
                  prev.city === newCity && 
                  prev.zip_code === zipcode &&
                  !isNewZipcode) {
                return prev; // No change, return same object
              }
              
              return {
                ...prev,
                // ALWAYS replace location data when pincode changes (don't merge with old values)
                state: newState,
                district: newDistrict,
                mandal: newMandal,
                city: newCity, // Ensure city is set
                zip_code: zipcode,
                // DO NOT auto-populate address - it's a user entry field
                // address field should remain unchanged (user will type it)
                // Set coordinates from map_data (for map centering on pincode)
                latitude: lat || (isNewZipcode ? '' : (prev.latitude || '')),
                longitude: lng || (isNewZipcode ? '' : (prev.longitude || '')),
              };
            });
          }
          
          // Update local zipcode state immediately to ensure display
          setLocalZipcode(zipcode);
        });
        
        // MapPicker will detect zipcode change and coordinates to update map center
        // Coordinates are now set from API response for automatic map centering
        
        // Load dependent dropdown data in background (for dropdown options only)
        // Use a longer delay to ensure all field updates are complete and rendered
        // This prevents flickering by ensuring dropdown loading happens after UI settles
        setTimeout(() => {
          if (suggestions.state) {
            // Load districts for dropdown options (async, doesn't block UI)
            // Note: Field values are already set from API, this is just for dropdown options
            loadDistricts(suggestions.state).then(() => {
              if (suggestions.district) {
                loadMandals(suggestions.state, suggestions.district).then(() => {
                  if (suggestions.mandal) {
                    loadCities(suggestions.mandal);
                  }
                });
              }
            });
          }
        }, 500); // Longer delay to ensure UI has fully settled and no flickering occurs
        
        console.log('[LocationSelector] Location fields auto-populated successfully');
        
        // Cache the response for faster future lookups
        pincodeCacheRef.current.set(zipcode, {
          suggestions: suggestions,
          map_data: mapData,
          timestamp: Date.now()
        });
        
        // Zipcode is already set in the startTransition block above - no need to set again
      } else {
        console.warn('[LocationSelector] No suggestions received from API');
      }
    } catch (error) {
      console.error('[LocationSelector] Error fetching zipcode data:', error);
      
      // Reset refs on error so user can retry
      lastProcessedZipcodeRef.current = '';
      
      // No fallback data - all data must come from API
      console.log('[LocationSelector] API failed - user must manually enter location fields');
    } finally {
      setZipcodeLoading(false);
      isProcessingZipcodeRef.current = false;
      
      // Zipcode is already set in the startTransition block above - no need to set again
      // This prevents duplicate updates and flickering
    }
  };

  // Fallback zipcode lookup removed - all data comes from API only
  const handleFallbackZipcodeLookup = async (zipcode: string) => {
    // No hardcoded fallback data - all pincode data must come from API
    console.log('[LocationSelector] No fallback data available - API must provide all data');
    // If API fails, user will need to manually enter location fields
  };
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Sync local zipcode with formData when it changes externally (but preserve during typing)
  // Use a ref to track if user is currently typing to prevent interference
  const isTypingRef = useRef(false);
  
  useEffect(() => {
    // Only sync if user is NOT currently typing (prevents interference with input)
    if (isTypingRef.current) {
      return;
    }
    
    // Sync when formData.zip_code changes externally (e.g., form reset, edit mode)
    // Only sync if the values are actually different to prevent loops
    const formZipcode = formData?.zip_code || '';
    if (formZipcode !== localZipcode) {
      // Only sync if formData has a value OR if localZipcode is empty and formData is also empty
      // This allows clearing the input
      if (formZipcode || (!formZipcode && !localZipcode)) {
        console.log('[LocationSelector] Syncing zipcode from formData:', formZipcode);
        setLocalZipcode(formZipcode);
        previousZipcodeLengthRef.current = formZipcode.length;
      }
    }
  }, [formData?.zip_code, localZipcode]);
  
  // Initialize local zipcode from formData on mount
  useEffect(() => {
    if (formData?.zip_code && !localZipcode) {
      setLocalZipcode(formData.zip_code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
  
  // Initialize from formData - only update when location fields change, NOT on zipcode changes
  useEffect(() => {
    if (formData) {
      // Use state/district/mandal/city fields directly (no _id fields)
      // Only update if values actually changed to prevent unnecessary re-renders
      const newState = formData.state || '';
      const newDistrict = formData.district || '';
      const newMandal = formData.mandal || '';
      const newCity = formData.city || '';

      // Batch all state updates together to prevent multiple re-renders
      let hasChanges = false;
      const updates: any = {};

      if (selectedState !== newState) {
        updates.state = newState;
        hasChanges = true;
      }
      if (selectedDistrict !== newDistrict) {
        updates.district = newDistrict;
        hasChanges = true;
      }
      if (selectedMandal !== newMandal) {
        updates.mandal = newMandal;
        hasChanges = true;
      }
      if (selectedCity !== newCity) {
        updates.city = newCity;
        hasChanges = true;
      }

      if (hasChanges) {
        startTransition(() => {
          if (updates.state !== undefined) setSelectedState(updates.state);
          if (updates.district !== undefined) setSelectedDistrict(updates.district);
          if (updates.mandal !== undefined) setSelectedMandal(updates.mandal);
          if (updates.city !== undefined) setSelectedCity(updates.city);
        });
      }
    }
    // Only depend on location fields, NOT on zip_code or entire formData
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.state, formData?.district, formData?.mandal, formData?.city]);

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

  // Ref to prevent multiple state change calls
  const stateChangeRef = useRef<string>('');
  
  const handleStateChange = (value: string) => {
    // Prevent duplicate calls
    if (stateChangeRef.current === value) {
      return;
    }
    stateChangeRef.current = value;
    
    setSelectedState(value);
    setSelectedDistrict('');
    setSelectedMandal('');
    setSelectedCity('');
    
    setFormData((prev: any) => ({
      ...prev,
      state: value,
      district: '',
      mandal: '',
      city: ''
      // Note: state_id, district_id, mandal_id, city_id are not used - removed to prevent backend errors
    }));

    if (value) {
      loadDistricts(value);
    }
  };

  // Ref to prevent multiple district change calls
  const districtChangeRef = useRef<string>('');
  
  const handleDistrictChange = (value: string) => {
    // Prevent duplicate calls
    if (districtChangeRef.current === value) {
      return;
    }
    districtChangeRef.current = value;
    setSelectedDistrict(value);
    setSelectedMandal('');
    setSelectedCity('');
    
    setFormData((prev: any) => ({
      ...prev,
      district: value,
      mandal: '',
      city: ''
      // Note: state_id, district_id, mandal_id, city_id are not used - removed to prevent backend errors
    }));

    if (value && selectedState) {
      loadMandals(selectedState, value);
    }
  };

  // Ref to prevent multiple mandal change calls
  const mandalChangeRef = useRef<string>('');
  
  const handleMandalChange = (value: string) => {
    // Prevent duplicate calls
    if (mandalChangeRef.current === value) {
      return;
    }
    mandalChangeRef.current = value;
    setSelectedMandal(value);
    setSelectedCity('');
    
    setFormData((prev: any) => ({
      ...prev,
      mandal: value,
      city: ''
      // Note: state_id, district_id, mandal_id, city_id are not used - removed to prevent backend errors
    }));

    if (value) {
      loadCities(value);
    }
  };

  const handleCityChange = (value: string) => {
    if (value) {
      setSelectedCity(value);
      
      setFormData((prev: any) => ({
        ...prev,
        city: value
        // Note: state_id, district_id, mandal_id, city_id are not used - removed to prevent backend errors
      }));
    }
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
            value={localZipcode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              // Only allow numeric input, max 6 digits
              const numericValue = value.replace(/\D/g, '').slice(0, 6);
              
              // Mark that user is typing to prevent useEffect from interfering
              isTypingRef.current = true;
              
              // Update local state immediately - allows clearing
              setLocalZipcode(numericValue);
              
              // Update formData immediately so it can be cleared
              setFormData((prev: any) => ({
                ...prev,
                zip_code: numericValue
              }));
              
              previousZipcodeLengthRef.current = numericValue.length;
              
              // Clear coordinates and location fields if zipcode is cleared
              if (numericValue.length < 6) {
                setFormData((prev: any) => ({
                  ...prev,
                  zip_code: numericValue,
                  latitude: '',
                  longitude: '',
                  state: '',
                  district: '',
                  mandal: '',
                  city: ''
                }));
                // Reset last processed zipcode when cleared
                lastProcessedZipcodeRef.current = '';
              }
              
              // Reset typing flag after a short delay
              setTimeout(() => {
                isTypingRef.current = false;
              }, 100);
              
              // DO NOT trigger API calls during typing - wait for blur or 6 digits + Enter
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              // If Enter is pressed and we have 6 digits, trigger fetch immediately
              if (e.key === 'Enter' && localZipcode.length === 6 && /^\d{6}$/.test(localZipcode)) {
                e.preventDefault();
                // Update formData first
                setFormData((prev: any) => ({
                  ...prev,
                  zip_code: localZipcode
                }));
                // Then trigger auto-population
                handleZipcodeAutoPopulation(localZipcode);
              }
            }}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              // Mark that user is no longer typing
              isTypingRef.current = false;
              
              // Update formData with zipcode value
              const zipcode = e.target.value.replace(/\D/g, '').slice(0, 6);
              
              // Update formData with zipcode value (ensures it's displayed)
              setFormData((prev: any) => ({
                ...prev,
                zip_code: zipcode
              }));
              
              // Clear dependent fields if zipcode becomes less than 6 digits
              if (zipcode.length < 6) {
                setFormData((prev: any) => ({
                  ...prev,
                  zip_code: zipcode,
                  state: '', district: '', mandal: '', city: '',
                  latitude: '', longitude: ''
                }));
                // Reset last processed zipcode when cleared
                lastProcessedZipcodeRef.current = '';
                // Clear selected dropdowns
                setSelectedState('');
                setSelectedDistrict('');
                setSelectedMandal('');
                setSelectedCity('');
              } else if (zipcode.length === 6 && /^\d{6}$/.test(zipcode)) {
                // Only trigger auto-population on blur if we have exactly 6 digits
                // This prevents multiple calls during typing
                handleZipcodeAutoPopulation(zipcode);
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData('text');
              const numericZipcode = pastedText.replace(/\D/g, '').slice(0, 6);
              
              // Update local state only
              setLocalZipcode(numericZipcode);
              previousZipcodeLengthRef.current = numericZipcode.length;
              
              // Update formData
              setFormData((prev: any) => ({
                ...prev,
                zip_code: numericZipcode
              }));

              // Only trigger fetch if we have exactly 6 digits after paste
              if (numericZipcode.length === 6 && /^\d{6}$/.test(numericZipcode)) {
                // Use setTimeout to ensure state is updated first
                setTimeout(() => {
                  handleZipcodeAutoPopulation(numericZipcode);
                }, 100);
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
          ⚡ Enter zipcode first to automatically populate state, district, mandal, and city
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

      {/* Coordinates removed - coordinates come ONLY from map picker component */}
    </div>
  );
};

export default LocationSelector;