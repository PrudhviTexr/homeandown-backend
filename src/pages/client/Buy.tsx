import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import PropertyMap from '@/components/PropertyMap';
import FilterPanel from '@/components/FilterPanel';
import PropertiesList from '@/components/PropertiesList';
import { PropertyService } from '@/services/PropertyService';
import { buildPropertyUrl } from '@/utils/url';
import { FALLBACK_IMAGE } from '@/utils/fallbackImage';

interface Property {
  id: string;
  title: string;
  price: number;
  listing_type: 'SALE' | 'RENT';
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  address: string;
  city: string;
  state: string;
  created_at: string;
  images: string[];
  latitude?: number | null;
  longitude?: number | null;
}


const Buy: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    state: '', // Always start with empty state
    city: '', // Always start with empty city
    propertyType: searchParams.get('propertyType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    bathrooms: searchParams.get('bathrooms') || '',
    minArea: searchParams.get('minArea') || '',
    maxArea: searchParams.get('maxArea') || '',
    furnishingStatus: searchParams.get('furnishingStatus') || '',
    facing: searchParams.get('facing') || '',
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => {
    return filters;
  }, [
    filters.state,
    filters.city,
    filters.propertyType,
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
    filters.bathrooms,
    filters.minArea,
    filters.maxArea,
    filters.furnishingStatus,
    filters.facing,
  ]);
  
  // Single effect to handle both initial load and filter changes
  useEffect(() => {
    fetchProperties();
  }, [memoizedFilters]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  // Debug: log property count and sample coordinates
  useEffect(() => {
    if (properties && properties.length) {
      const first = properties[0];
      // Removed console.log to prevent unnecessary re-renders
    }
  }, [properties]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PropertyService.getPropertiesByType('SALE', memoizedFilters);

      // If no properties found, show appropriate message
      if (data.length === 0) {
        setProperties([]);
        if (memoizedFilters.city) {
          setError(`No properties found in ${memoizedFilters.city} matching your criteria.`);
        } else {
          setError('No properties found matching your criteria.');
        }
        return;
      }

      setProperties((data || []).map(p => ({
        ...p,
        price: p.price ?? 0,
        listing_type: p.listing_type as 'SALE' | 'RENT',
        bedrooms: p.bedrooms ?? 0,
        bathrooms: p.bathrooms ?? 0,
        area_sqft: p.area_sqft ?? 0
      })));
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to fetch properties from database. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (k: string, v: string) => {
    console.log('[FILTER] Changing filter:', k, 'from', filters[k], 'to', v);
    const newFilters = { ...filters, [k]: v };
    setFilters(newFilters);
    console.log('[FILTER] New filters:', newFilters);
    console.log('[FILTER] State filter specifically:', newFilters.state);
    console.log('[FILTER] City filter specifically:', newFilters.city);

    // Update URL parameters
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      }
    });
    setSearchParams(newSearchParams);
  };

  const handleBatchChange = (changes: Record<string, string>) => {
    console.log('[FILTER] Batch changing filters:', changes);
    const newFilters = { ...filters, ...changes };
    setFilters(newFilters);
    console.log('[FILTER] New filters after batch change:', newFilters);

    // Update URL parameters
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      }
    });
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    const emptyFilters = {
      state: '',
      city: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
    };
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  };

  const handlePropertyClick = (propertyId: string, title?: string) => {
    // Allow viewing property details without authentication; build SEO-friendly URL
    if (title) {
      navigate(buildPropertyUrl(title, propertyId));
    } else {
      navigate(`/property/${propertyId}`);
    }
    // Smooth scroll to top with slight delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      {/* Hero remains unchanged */}
      {/* Layout wrapper */}
      <div className="flex-1 flex flex-col">
        <section className="max-w-7xl mx-auto px-4 pb-8 flex-1 w-full">
          {/* Filters and header */}
          <header className="text-center mb-8">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span className="bg-white px-4 py-2 rounded-full shadow">🏠 {properties.length} Properties Available</span>
              <span className="bg-white px-4 py-2 rounded-full shadow">📍 Multiple Locations</span>
              <span className="bg-white px-4 py-2 rounded-full shadow">✅ Verified Listings</span>
            </div>
          </header>

          {/* Filters */}
            <FilterPanel
              filters={memoizedFilters}
              onFilterChange={handleChange}
              onBatchChange={handleBatchChange}
              onClearFilters={clearFilters}
              listingType="SALE"
            />

          <div className="hidden lg:block mt-8">
            <div className="map-layout">
              <div className="map-column">
                <div className="map-container">
              <PropertyMap
                filters={{
                  city: memoizedFilters.city,
                  state: memoizedFilters.state,
                  propertyType: memoizedFilters.propertyType,
                  minPrice: memoizedFilters.minPrice ? parseInt(memoizedFilters.minPrice) : undefined,
                  maxPrice: memoizedFilters.maxPrice ? parseInt(memoizedFilters.maxPrice) : undefined,
                  bedrooms: memoizedFilters.bedrooms ? parseInt(memoizedFilters.bedrooms) : undefined,
                  bathrooms: memoizedFilters.bathrooms ? parseInt(memoizedFilters.bathrooms) : undefined,
                  minArea: memoizedFilters.minArea ? parseInt(memoizedFilters.minArea) : undefined,
                  maxArea: memoizedFilters.maxArea ? parseInt(memoizedFilters.maxArea) : undefined,
                  furnishingStatus: memoizedFilters.furnishingStatus,
                  facing: memoizedFilters.facing,
                  listingType: 'SALE'
                }}
                onPropertySelect={(p) => handlePropertyClick(p.id)}
                height="100%"
              />
                </div>
              </div>

              <div className="list-column">
                <PropertiesList
                  properties={(properties || []).map(p => ({ ...p, images: (p.images && p.images.length ? p.images : [FALLBACK_IMAGE]) }))}
                  loading={loading}
                  error={error}
                  onPropertyClick={(id: string) => {
                    const item = properties.find(x => x.id === id);
                    handlePropertyClick(id, item?.title);
                  }}
                  showMap={true}
                  listingType="SALE"
                />
              </div>
            </div>
          </div>

          {/* Mobile / small screens toggle fallback */}
          <div className="lg:hidden mt-8">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowMap(s => !s)}
                className={`px-5 py-2 rounded-md text-sm font-medium ${showMap ? 'bg-[#0ca5e9] text-white' : 'bg-white border text-gray-700'}`}
              >{showMap ? 'Hide Map' : 'Show Map'}</button>
            </div>
            {showMap ? (
              <div className="h-[400px] mb-6 rounded-lg overflow-hidden shadow">
                <PropertyMap
                  filters={{
                    city: memoizedFilters.city,
                    state: memoizedFilters.state,
                    propertyType: memoizedFilters.propertyType,
                    minPrice: memoizedFilters.minPrice ? parseInt(memoizedFilters.minPrice) : undefined,
                    maxPrice: memoizedFilters.maxPrice ? parseInt(memoizedFilters.maxPrice) : undefined,
                    bedrooms: memoizedFilters.bedrooms ? parseInt(memoizedFilters.bedrooms) : undefined,
                    bathrooms: memoizedFilters.bathrooms ? parseInt(memoizedFilters.bathrooms) : undefined,
                    minArea: memoizedFilters.minArea ? parseInt(memoizedFilters.minArea) : undefined,
                    maxArea: memoizedFilters.maxArea ? parseInt(memoizedFilters.maxArea) : undefined,
                    furnishingStatus: memoizedFilters.furnishingStatus,
                    facing: memoizedFilters.facing,
                    listingType: 'SALE'
                  }}
                  onPropertySelect={(p) => handlePropertyClick(p.id)}
                  height="100%"
                />
              </div>
            ) : null}
            <PropertiesList
              properties={(properties || []).map(p => ({ ...p, images: (p.images && p.images.length ? p.images : ['https://via.placeholder.com/600x400?text=Property']) }))}
              loading={loading}
              error={error}
              onPropertyClick={handlePropertyClick}
              showMap={false}
              listingType="SALE"
            />
          </div>
        </section>
      </div>
      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Buy;