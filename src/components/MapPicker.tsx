import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Marker as LeafletMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { pyFetch } from '@/utils/backend';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icon - memoized to prevent re-creation
const createCustomIcon = (() => {
  let cachedIcon: L.DivIcon | null = null;
  return (color: string = '#0ca5e9') => {
    if (cachedIcon && color === '#0ca5e9') {
      return cachedIcon;
    }
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 18px;
            font-weight: bold;
          ">📍</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });
    if (color === '#0ca5e9') {
      cachedIcon = icon;
    }
    return icon;
  };
})();

interface MapPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string) => void;
  height?: string;
  showReverseGeocode?: boolean;
  onAddressUpdate?: (address: string) => void;
  zipCode?: string; // Pincode from form
  onZipCodeChange?: (zipCode: string) => void; // Update pincode when map location changes
}

// Component to handle map clicks - memoized to prevent re-renders
const MapClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = memo(({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
});
MapClickHandler.displayName = 'MapClickHandler';

// Component to center map on coordinates with smooth scroll - memoized
const MapCenter: React.FC<{ center: [number, number]; zoom?: number }> = memo(({ center, zoom = 15 }) => {
  const map = useMap();
  const prevCenterRef = useRef<[number, number] | null>(null);
  const isMapReadyRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Cleanup any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Wait for map to be fully initialized before setting view
    if (!map || !map.getContainer()) {
      return;
    }
    
    // Check if map panes are ready (critical for Leaflet)
    const checkMapReady = () => {
      try {
        // Check if map panes exist (they're created during map initialization)
        const panes = map.getPane('mapPane');
        if (!panes) {
          return false;
        }
        
        // Check if container is in DOM
        const container = map.getContainer();
        if (!container || !container.parentElement) {
          return false;
        }
        
        return true;
      } catch {
        return false;
      }
    };
    
    // Only update if center actually changed (prevent unnecessary re-renders)
    if (!prevCenterRef.current || 
        Math.abs(prevCenterRef.current[0] - center[0]) > 0.0001 || 
        Math.abs(prevCenterRef.current[1] - center[1]) > 0.0001) {
      prevCenterRef.current = center;
      
      // Function to set view when map is ready
      const setViewWhenReady = () => {
        if (!checkMapReady()) {
          // Map not ready yet, try again after a short delay
          timeoutRef.current = setTimeout(setViewWhenReady, 50);
          return;
        }
        
        // Map is ready, set the view
        try {
          // Invalidate size to ensure map calculates correctly
          map.invalidateSize();
          
          // Use a small delay to ensure DOM is fully ready
          timeoutRef.current = setTimeout(() => {
            try {
              if (map && checkMapReady()) {
                map.setView(center, zoom, { animate: true, duration: 0.5 });
                isMapReadyRef.current = true;
              }
            } catch (err) {
              console.error('[MapCenter] Error setting map view:', err);
            }
          }, 150);
        } catch (err) {
          console.error('[MapCenter] Error preparing map view:', err);
        }
      };
      
      // Start checking if map is ready
      if (isMapReadyRef.current) {
        // Map was ready before, set view immediately (with small delay for safety)
        timeoutRef.current = setTimeout(() => {
          try {
            if (map && checkMapReady()) {
              map.setView(center, zoom, { animate: true, duration: 0.5 });
            }
          } catch (err) {
            console.error('[MapCenter] Error setting map view:', err);
          }
        }, 50);
      } else {
        // Map not ready yet, wait for it
        setViewWhenReady();
      }
    }
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [center, zoom, map]);
  
  return null;
});
MapCenter.displayName = 'MapCenter';

// Memoized MapPicker component to prevent unnecessary re-renders
const MapPicker: React.FC<MapPickerProps> = memo(({
  latitude,
  longitude,
  onLocationChange,
  height = '400px',
  showReverseGeocode = true,
  onAddressUpdate,
  zipCode,
  onZipCodeChange,
}) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isDraggingRef = useRef(false); // Ref to track if marker is being dragged

  // Initialize map center (default to India center)
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);

  // Ref to track last processed coordinates to prevent unnecessary updates
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  
  // Initialize marker position from props (coordinates take priority)
  useEffect(() => {
    console.log('[MapPicker] Received coordinates from props:', { latitude, longitude });
    
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      console.log('[MapPicker] Parsed coordinates:', { lat, lng, isValidLat: !isNaN(lat), isValidLng: !isNaN(lng) });
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Only update if coordinates actually changed (prevent infinite loops)
        if (!lastCoordsRef.current || 
            Math.abs(lastCoordsRef.current.lat - lat) > 0.0001 || 
            Math.abs(lastCoordsRef.current.lng - lng) > 0.0001) {
          console.log('[MapPicker] Setting marker position and map center:', { lat, lng });
          lastCoordsRef.current = { lat, lng };
          const newPosition: [number, number] = [lat, lng];
          setMarkerPosition(newPosition);
          setMapCenter(newPosition);
        } else {
          console.log('[MapPicker] Coordinates unchanged, but ensuring marker is visible');
          // Ensure marker is set even if coordinates haven't changed significantly
          if (!markerPosition) {
            console.log('[MapPicker] Force setting marker position');
            const newPosition: [number, number] = [lat, lng];
            setMarkerPosition(newPosition);
            setMapCenter(newPosition);
          }
        }
      } else {
        console.warn('[MapPicker] Invalid coordinates received:', { lat, lng });
      }
    } else if (!latitude || !longitude) {
      console.log('[MapPicker] Coordinates cleared, resetting marker');
      // Reset if coordinates are cleared
      lastCoordsRef.current = null;
      setMarkerPosition(null);
    }
  }, [latitude, longitude]);

  // Ref to track last processed zipcode to prevent duplicate map updates
  const lastProcessedZipcodeRef = useRef<string>('');
  // Simple cache for map coordinates to speed up repeated lookups
  const mapCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  
  // When pincode changes externally (from LocationSelector), center map on pincode area
  // This allows user to then click/drag marker to set exact coordinates
  // Debounce to prevent rapid updates
  useEffect(() => {
    // Priority 1: If zipCode changes, ALWAYS fetch fresh coordinates (ignore existing lat/lng)
    // This ensures we get fresh coordinates from pincode API, not stale form data
    if (zipCode && zipCode.length === 6 && /^\d{6}$/.test(zipCode)) {
      // Only process if zipcode actually changed (prevents duplicate calls)
      if (lastProcessedZipcodeRef.current !== zipCode) {
        // Debounce map updates to prevent flickering
        const timeoutId = setTimeout(() => {
          console.log('[MapPicker] Zipcode changed, fetching fresh coordinates from API:', zipCode);
          lastProcessedZipcodeRef.current = zipCode;
          
          // Always fetch fresh coordinates from API - don't use cache for pincode changes
          // This ensures we get the latest coordinates from the pincode API
          handlePincodeSearch(zipCode);
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
      return; // Exit early - zipcode processing takes priority
    }
    
    // Priority 2: If coordinates are provided from props AND no zipcode is being processed
    if (latitude && longitude && !zipCode) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Use provided coordinates only if no zipcode is active
        if (!lastCoordsRef.current || 
            Math.abs(lastCoordsRef.current.lat - lat) > 0.0001 || 
            Math.abs(lastCoordsRef.current.lng - lng) > 0.0001) {
          console.log('[MapPicker] Using coordinates from props (no zipcode active):', lat, lng);
          lastCoordsRef.current = { lat, lng };
          
          // Use React.startTransition for non-urgent updates to prevent blocking
          React.startTransition(() => {
            setMapCenter([lat, lng]);
            setMarkerPosition([lat, lng]);
          });
        }
      }
    }
  }, [zipCode, latitude, longitude]);

  // Debug: Log marker position changes
  useEffect(() => {
    console.log('[MapPicker] Marker position changed:', markerPosition);
  }, [markerPosition]);

  // Reverse geocode coordinates to get address (memoized)
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await pyFetch('/api/properties/geocode/reverse', {
        method: 'POST',
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
        }),
        useApiKey: false,
      });

      if (response?.success && response?.location) {
        const location = response.location;
        const formattedAddress = location.formatted_address || 
          `${location.city || ''}, ${location.district || ''}, ${location.state || ''}`.trim();
        
        setAddress(formattedAddress);
        if (onAddressUpdate) {
          onAddressUpdate(formattedAddress);
        }
        if (onZipCodeChange && location.pincode) {
          onZipCodeChange(location.pincode);
        }
      }
    } catch (err: any) {
      console.error('Reverse geocoding error:', err);
      setError('Could not get address for this location');
      setAddress('');
    } finally {
      setLoading(false);
    }
  }, [onAddressUpdate, onZipCodeChange]);

  // Handle map click - saves coordinates to form (memoized to prevent re-renders)
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    // Don't update if currently dragging (prevents popup closing)
    if (isDraggingRef.current) {
      return;
    }
    
    console.log('[MapPicker] User clicked on map, setting coordinates:', { lat, lng });
    
    setMarkerPosition([lat, lng]);
    setMapCenter([lat, lng]);
    setError(null);

    // Update parent form - coordinates are saved to database
    onLocationChange(lat.toString(), lng.toString());
    
    console.log('[MapPicker] Coordinates sent to parent form:', lat.toString(), lng.toString());

    // Reverse geocode to get address
    if (showReverseGeocode) {
      await reverseGeocode(lat, lng);
    }
  }, [onLocationChange, showReverseGeocode, reverseGeocode]);

  // Memoize marker icon and event handlers at top level (not conditionally)
  const markerIcon = useMemo(() => createCustomIcon('#0ca5e9'), []);
  
  const markerEventHandlers = useMemo(() => ({
    dragstart: () => {
      isDraggingRef.current = true;
    },
    drag: () => {
      // Keep dragging flag true during drag
      isDraggingRef.current = true;
    },
    dragend: (e: any) => {
      isDraggingRef.current = false;
      const marker = e.target;
      const position = marker.getLatLng();
      const newLat = position.lat;
      const newLng = position.lng;
      
      console.log('[MapPicker] User dragged marker to new position:', { lat: newLat, lng: newLng });
      
      // Update position without causing re-render that closes popup
      setMarkerPosition([newLat, newLng]);
      // Save coordinates to form (will be stored in database when form is submitted)
      onLocationChange(newLat.toString(), newLng.toString());
      
      console.log('[MapPicker] New coordinates sent to parent form:', newLat.toString(), newLng.toString());
      
      // Reverse geocode new position (async, don't block)
      if (showReverseGeocode) {
        reverseGeocode(newLat, newLng).catch(err => {
          console.error('Reverse geocode error:', err);
        });
      }
    },
  }), [onLocationChange, showReverseGeocode, reverseGeocode]);

  // Ref to prevent multiple simultaneous map updates
  const isUpdatingMapRef = useRef<boolean>(false);
  
  // Handle search by pincode
  const handlePincodeSearch = async (pincode: string, showLoading: boolean = true) => {
    if (!pincode || pincode.length !== 6) {
      if (showLoading) {
        setError('Please enter a valid 6-digit pincode');
      }
      return;
    }

    // Prevent multiple simultaneous calls
    if (isUpdatingMapRef.current) {
      console.log('[MapPicker] Already updating map, skipping:', pincode);
      return;
    }

    try {
      isUpdatingMapRef.current = true;
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log('[MapPicker] Fetching map coordinates for pincode:', pincode);
      const response = await pyFetch(`/api/properties/pincode/${pincode}/suggestions`, {
        useApiKey: false,
      });

      if (response?.suggestions) {
        const lat = parseFloat(response.suggestions.latitude);
        const lng = parseFloat(response.suggestions.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          console.log('[MapPicker] Setting map center to:', lat, lng);
          
          // Cache coordinates for faster future lookups
          mapCacheRef.current.set(pincode, { lat, lng });
          
          // Only update if coordinates actually changed (prevent unnecessary re-renders)
          if (!lastCoordsRef.current || 
              Math.abs(lastCoordsRef.current.lat - lat) > 0.0001 || 
              Math.abs(lastCoordsRef.current.lng - lng) > 0.0001) {
            lastCoordsRef.current = { lat, lng };
            
            // Center map on pincode area and show marker
            // Map will automatically scroll to this location
            setMapCenter([lat, lng]);
            setMarkerPosition([lat, lng]);
            
            // Set initial coordinates from pincode (user can fine-tune by clicking/dragging)
            // ALWAYS set coordinates from pincode to ensure they're populated
            console.log('[MapPicker] Setting coordinates from pincode:', { lat, lng });
            onLocationChange(lat.toString(), lng.toString());
          }
          
          // MapCenter component will handle smooth scrolling automatically
          
          // DO NOT auto-populate address from pincode - address is a user entry field
          // Address should only be set when user clicks on map (reverse geocoding)
          // if (response.suggestions.address) {
          //   setAddress(response.suggestions.address);
          //   if (onAddressUpdate) {
          //     onAddressUpdate(response.suggestions.address);
          //   }
          // }
        } else {
          if (showLoading) {
            setError('Could not find coordinates for this pincode');
          }
        }
      } else {
        if (showLoading) {
          setError('Pincode not found');
        }
      }
    } catch (err: any) {
      console.error('[MapPicker] Pincode search error:', err);
      if (showLoading) {
        setError('Failed to search pincode');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      isUpdatingMapRef.current = false;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Pinpoint Exact Property Location
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Enter pincode above to center the map. Then <strong>scroll and click</strong> on the map to set the exact location, or <strong>drag the marker</strong> to fine-tune.
        </p>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        {address && !error && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            📍 {address}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative border border-gray-300 rounded-lg overflow-hidden" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
          preferCanvas={true}
          zoomControl={true}
          loading="lazy"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            updateWhenZooming={false}
            updateWhenIdle={true}
          />
          
          {/* Center map on coordinates with smooth scroll */}
          <MapCenter center={mapCenter} zoom={15} />
          
          {/* Handle map clicks */}
          <MapClickHandler onMapClick={handleMapClick} />
          
          {/* Show draggable marker if position is set */}
          {markerPosition && (
            <Marker
              key={`marker-${markerPosition[0]}-${markerPosition[1]}`}
              position={markerPosition}
              icon={markerIcon}
              draggable={true}
              eventHandlers={markerEventHandlers}
            >
              {/* Optional: Add popup */}
            </Marker>
          )}
        </MapContainer>

        {/* Instructions overlay */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs z-[1000]">
          <p className="font-medium text-gray-700 mb-1">💡 Click to set location</p>
          <p className="text-gray-600">📍 Drag marker to fine-tune</p>
        </div>
      </div>

      {/* Coordinates are hidden - only set via map interaction */}
      {latitude && longitude && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
          📍 Location set: <strong>Lat: {parseFloat(latitude || '0').toFixed(6)}, Lng: {parseFloat(longitude || '0').toFixed(6)}</strong>
        </div>
      )}
      
      {/* Debug: Show marker state */}
      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
        <div><strong>Debug Info:</strong></div>
        <div>Props: lat={latitude}, lng={longitude}</div>
        <div>Marker Position: {markerPosition ? `[${markerPosition[0].toFixed(6)}, ${markerPosition[1].toFixed(6)}]` : 'null'}</div>
        <div>Map Center: [{mapCenter[0].toFixed(6)}, {mapCenter[1].toFixed(6)}]</div>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        💡 <strong>Scroll and click on map</strong> to set exact location, or <strong>drag the marker</strong> to fine-tune. Coordinates are automatically saved.
      </p>
    </div>
  );
});

MapPicker.displayName = 'MapPicker';

export default MapPicker;
