/* ----------------------------------------------------------------
   src/components/PropertyMap.tsx
   ---------------------------------------------------------------- */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import ApiService from '@/services/api';
import { formatIndianCurrency } from '../utils/currency';

// Leaflet icon configuration commented out until package is available
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
// });

/* ─────────────────────────── Types ───────────────────────────── */
export interface Property {
  id: string;
  title: string;
  price: number | null;          // SALE : price, RENT : null
  monthly_rent: number | null;   // RENT : monthly_rent, SALE : null
  property_type: string;
  listing_type: 'SALE' | 'RENT';
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  images?: string[] | null;
}

interface PropertyMapProps {
  filters?: {
    city?: string;
    state?: string;
    minPrice?: number;
    maxPrice?: number;
    minRent?: number;
    maxRent?: number;
    propertyType?: string;
    listingType?: 'SALE' | 'RENT';
    bedrooms?: number;
    bathrooms?: number;
    minArea?: number;
    maxArea?: number;
    furnishingStatus?: string;
    facing?: string;
  };
  onPropertySelect?: (p: Property) => void;
  height?: string;        // e.g. "400px" (default)
}

/* ───────────────────────── Component ─────────────────────────── */
const PropertyMap: React.FC<PropertyMapProps> = ({
  filters,
  onPropertySelect,
  height = '400px',
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [center, setCenter]         = useState<[number, number]>([17.6868, 83.2185]); // Default: Vizag
  const [error, setError]           = useState<string | null>(null);

  // Configure default icon using CDN URLs so the markers render correctly
  useEffect(() => {
    try {
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      // Apply to prototype to avoid missing-icon issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      L.Marker.prototype.options.icon = DefaultIcon;
    } catch (e) {
      // ignore icon setup errors in non-browser environments
      console.warn('Leaflet icon setup failed', e);
    }
  }, []);

  /* ─────────────── Data fetch (Flask API) ────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true); 
      try {
        // Fetch from Python API with filters
        const searchFilters: any = {};
        if (filters?.city) searchFilters.city = filters.city;
        if (filters?.state) searchFilters.state = filters.state;
        if (filters?.propertyType) searchFilters.property_type = filters.propertyType;
        if (filters?.listingType) searchFilters.listing_type = filters.listingType;
        if (filters?.minPrice) searchFilters.min_price = filters.minPrice;
        if (filters?.maxPrice) searchFilters.max_price = filters.maxPrice;
        if (filters?.minRent) searchFilters.min_rent = filters.minRent;
        if (filters?.maxRent) searchFilters.max_rent = filters.maxRent;
        if (filters?.bedrooms) searchFilters.bedrooms = filters.bedrooms;
        if (filters?.bathrooms) searchFilters.bathrooms = filters.bathrooms;
        if (filters?.minArea) searchFilters.min_area = filters.minArea;
        if (filters?.maxArea) searchFilters.max_area = filters.maxArea;
        if (filters?.furnishingStatus) searchFilters.furnishing_status = filters.furnishingStatus;
        if (filters?.facing) searchFilters.facing = filters.facing;
        
        console.log('[PropertyMap] Fetching with filters:', searchFilters);
        console.log('[PropertyMap] State filter specifically:', filters?.state);
        console.log('[PropertyMap] City filter specifically:', filters?.city);
        const data = await ApiService.getProperties(searchFilters);
        console.log('[PropertyMap] Received properties:', data?.length || 0);
        if (!data) {
          setError('Failed to load property map data');
          setProperties([]);
          return;
        }
        
        // Filter out properties without coordinates and coerce to numbers
        const mapped = (data || [])
          .map((p: any) => {
            // Safety check for property object
            if (!p || typeof p !== 'object') {
              console.warn('[PropertyMap] Invalid property object:', p);
              return null;
            }
            
            return {
              ...p,
              latitude: p.latitude !== undefined && p.latitude !== null ? Number(p.latitude) : undefined,
              longitude: p.longitude !== undefined && p.longitude !== null ? Number(p.longitude) : undefined,
            };
          })
          .filter((p: any) => p !== null) // Remove null entries
          .filter((p: any) => typeof p.latitude === 'number' && !isNaN(p.latitude) && typeof p.longitude === 'number' && !isNaN(p.longitude))
          .filter((p: any) => {
            // Ensure properties have valid price/rent based on listing type
            if (p.listing_type === 'SALE') {
              return p.price && p.price > 0;
            } else if (p.listing_type === 'RENT') {
              return p.monthly_rent && p.monthly_rent > 0;
            }
            return true;
          });
          
        if (mapped.length > 0) {
          setProperties(mapped);
          setCenter([mapped[0].latitude, mapped[0].longitude]);
        } else {
          console.warn('No properties with valid coordinates found');
          setProperties([]);
        }
      } catch (err) {
        console.error('Error fetching properties for map:', err);
        setError('Failed to load property map data');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  const priceValue = (p: Property) => {
    if (p.listing_type === 'SALE') {
      return p.price || 0;
    } else {
      return p.monthly_rent || 0;
    }
  };


  /* ───────────────────────── Render ──────────────────────────── */
  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg h-full w-full"
        style={{ height }}
        data-testid="property-map-loading"
      >
        <div className="text-center p-4">
          <div className="animate-spin h-8 w-8 border-b-2 border-[#90C641] rounded-full mx-auto mb-2" />
          <p className="text-gray-600 text-sm font-medium">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error || properties.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg h-full w-full"
        style={{ height }}
        data-testid="property-map-error"
      >
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">{error || "No properties found in this area"}</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg h-full w-full map-container" style={{ height }} data-testid="property-map">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        className="leaflet-container"
      >
        {/* Debug overlay: shows marker count and bounds for quick verification */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1200 }}>
          <div className="bg-white bg-opacity-90 text-sm text-gray-700 rounded-lg p-2 shadow">
            <div><strong>Markers:</strong> {(properties || []).length}</div>
            {(properties || []).length > 0 && properties[0] && (
              <div className="text-xs text-gray-500">
                First: {properties[0].latitude || 'N/A'}, {properties[0].longitude || 'N/A'}
              </div>
            )}
          </div>
        </div>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds component - adjusts view to include all markers */}
        <FitBounds positions={(properties || [])
          .map(p => [p.latitude, p.longitude] as [number, number])
          .filter(pos => pos && pos[0] && pos[1] && !isNaN(pos[0]) && !isNaN(pos[1]))
        } />

        {(properties || []).map(p => {
          // Safety check for coordinates
          if (!p.latitude || !p.longitude || isNaN(p.latitude) || isNaN(p.longitude)) {
            return null;
          }
          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
            >
            <Popup>
              <div className="w-64">
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                )}

                <h3 className="font-semibold text-lg mb-1">{p.title || 'Property Title'}</h3>
                <p className="text-[#90C641] font-bold text-xl mb-2">
                  {formatIndianCurrency(priceValue(p))}
                </p>

                <div className="text-sm text-gray-600 mb-2">
                  {p.property_type !== 'plot' ? (
                    <p>{p.bedrooms || 'N/A'} bed • {p.bathrooms || 'N/A'} bath</p>
                  ) : (
                    <p>Plot/Land</p>
                  )}
                  <p>{(p.area_sqft || 0).toLocaleString()} sqft</p>
                  <p>{p.address || 'Address not available'}</p>
                  <p>{p.city || 'N/A'}, {p.state || 'N/A'}</p>
                </div>

                <button
                  onClick={() => onPropertySelect?.(p)}
                  className="w-full bg-[#90C641] text-white py-2 px-4 rounded-lg hover:bg-[#7DAF35] transition-colors"
                  aria-label={`View details for ${p.title}`}>
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
          );
        }).filter(Boolean)}
      </MapContainer>
    </div>
  );
};

/* Helper component to fit map to markers */
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    try {
      // Enhanced safety checks
      if (!positions || !Array.isArray(positions) || positions.length === 0) {
        console.warn('[FitBounds] Invalid positions array:', positions);
        return;
      }

      // Filter out invalid positions
      const validPositions = positions.filter(pos => 
        pos && 
        Array.isArray(pos) && 
        pos.length === 2 && 
        typeof pos[0] === 'number' && 
        typeof pos[1] === 'number' &&
        !isNaN(pos[0]) && 
        !isNaN(pos[1])
      );

      if (validPositions.length === 0) {
        console.warn('[FitBounds] No valid positions found');
        return;
      }

      const latlngs = validPositions.map(p => {
        try {
          return L.latLng(p[0], p[1]);
        } catch (e) {
          console.warn('[FitBounds] Invalid coordinates:', p);
          return null;
        }
      }).filter((latlng): latlng is L.LatLng => latlng !== null);

      if (latlngs.length === 0) {
        console.warn('[FitBounds] No valid latlngs created');
        return;
      }

      const bounds = L.latLngBounds(latlngs);
      
      // If only one marker, set a default zoom/center
      if (latlngs.length === 1) {
        map.setView(latlngs[0], 12);
      } else {
        map.fitBounds(bounds.pad(0.2));
      }
    } catch (e) {
      console.error('[FitBounds] Error fitting bounds:', e);
    }
  }, [positions, map]);

  return null;
}

export default PropertyMap;
