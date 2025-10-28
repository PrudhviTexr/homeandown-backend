import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import PropertyMap from '@/components/PropertyMap'
import FilterPanel from '@/components/FilterPanel'
import PropertiesList from '@/components/PropertiesList'
import { PropertyService } from '@/services/PropertyService'
import { buildPropertyUrl } from '@/utils/url';
import { FALLBACK_IMAGE } from '@/utils/fallbackImage';


interface Property {
  id: string;
  title: string
  monthly_rent: number | null
  security_deposit: number | null
  property_type: string
  bedrooms: number | null
  bathrooms: number | null
  area_sqft: number | null
  address: string
  city: string
  state: string
  available_from?: string | null
  furnishing_status?: string | null
  images: string[]
}

const Rent: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    state: '', // Always start with empty state
    city: '', // Always start with empty city
    propertyType: searchParams.get('propertyType') || '',
    minRent: searchParams.get('minRent') || '',
    maxRent: searchParams.get('maxRent') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    bathrooms: searchParams.get('bathrooms') || '',
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters.state,
    filters.city,
    filters.propertyType,
    filters.minRent,
    filters.maxRent,
    filters.bedrooms,
    filters.bathrooms,
  ]);

  useEffect(() => {
    fetchProperties()
  }, [memoizedFilters]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProperties = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PropertyService.getPropertiesByType('RENT', memoizedFilters);

      // If no properties found, show appropriate message
      if (data.length === 0) {
        setProperties([])
        if (memoizedFilters.city) {
          setError(`No rental properties found in ${memoizedFilters.city} matching your criteria.`)
        } else {
          setError('No rental properties found matching your criteria.')
        }
        return
      }

      setProperties(data)
      setError(null) // Clear any previous errors
    } catch (error) {
      console.error('Error fetching rental properties:', error);
      setError('Failed to fetch rental properties from database. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (k: string, v: string) => {
    const newFilters = { ...filters, [k]: v }
    setFilters(newFilters)

    // Update URL parameters
    const newSearchParams = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value)
      }
    })
    setSearchParams(newSearchParams)
  }

  const clearFilters = () => {
    const emptyFilters = {
      state: '',
      city: '',
      propertyType: '',
      minRent: '',
      maxRent: '',
      bedrooms: '',
      bathrooms: '',
    };
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  };

  const handlePropertyClick = (propertyId: string, title?: string) => {
    if (title) navigate(buildPropertyUrl(title, propertyId));
    else navigate(`/property/${propertyId}`);
    // Smooth scroll to top with slight delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="relative overflow-hidden mb-16">
        <img
          src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg"
          alt="Host your property"
          className="w-full h-[350px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#162e5a]/90 via-[#162e5a]/70 to-transparent backdrop-blur-sm flex items-center">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 mt-24">
              Find Your Perfect Home to Rent
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-6">
              Discover premium rental properties across India
            </p>
          </div>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 pb-8 flex-1 w-full">
        <div>




          <header className="text-center mb-8">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span className="bg-white px-4 py-2 rounded-full shadow">🏠 {properties.length} Rental Properties</span>
              <span className="bg-white px-4 py-2 rounded-full shadow">📍 Prime Locations</span>
              <span className="bg-white px-4 py-2 rounded-full shadow">✅ Ready to Move</span>
            </div>
          </header>

          {/* Filters */}
          <FilterPanel
            filters={filters}
            onFilterChange={handleChange}
            onClearFilters={clearFilters}
            listingType="RENT"
            className='mt-[10px]'
          />

          {/* Large screens side-by-side layout */}
          <div className="hidden lg:flex gap-6 mt-8 relative" style={{ minHeight: '600px' }}>
            <div className="w-1/2 h-[650px] sticky top-24 rounded-lg overflow-hidden shadow">
              <PropertyMap
                filters={{
                  city: filters.city,
                  state: filters.state,
                  propertyType: filters.propertyType,
                  minPrice: filters.minRent ? parseInt(filters.minRent) : undefined,
                  maxPrice: filters.maxRent ? parseInt(filters.maxRent) : undefined,
                  listingType: 'RENT'
                }}
                onPropertySelect={(p) => handlePropertyClick(p.id)}
                height="100%"
              />
            </div>
            <div className="w-1/2 overflow-y-auto pr-2" style={{ maxHeight: '650px' }}>
              <PropertiesList
                properties={(properties || []).map(p => ({ ...p, images: (p.images && p.images.length ? p.images : [FALLBACK_IMAGE]) }))}
                loading={loading}
                error={error}
                onPropertyClick={(id: string) => {
                  const item = properties.find(x => x.id === id);
                  handlePropertyClick(id, item?.title);
                }}
                showMap={true}
                listingType="RENT"
              />
            </div>
          </div>
          {/* Mobile layout with toggle */}
          <div className="lg:hidden mt-8">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowMap(s => !s)}
                className={`px-5 py-2 rounded-md text-sm font-medium ${showMap ? 'bg-[#0ca5e9] text-white' : 'bg-white border text-gray-700'}`}
              >{showMap ? 'Hide Map' : 'Show Map'}</button>
            </div>
            {showMap && (
              <div className="h-[400px] mb-6 rounded-lg overflow-hidden shadow">
                <PropertyMap
                  filters={{
                    city: filters.city,
                    state: filters.state,
                    propertyType: filters.propertyType,
                    minPrice: filters.minRent ? parseInt(filters.minRent) : undefined,
                    maxPrice: filters.maxRent ? parseInt(filters.maxRent) : undefined,
                    listingType: 'RENT'
                  }}
                  onPropertySelect={(p) => handlePropertyClick(p.id)}
                  height="100%"
                />
              </div>
            )}
            <PropertiesList
              properties={(properties || []).map(p => ({ ...p, images: (p.images && p.images.length ? p.images : [FALLBACK_IMAGE]) }))}
              loading={loading}
              error={error}
              onPropertyClick={handlePropertyClick}
              showMap={false}
              listingType="RENT"
            />
          </div>

          {/* When map is hidden, show additional rental stats */}
          {!showMap && properties.length > 0 && (
            <div className="mt-12 bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-[#061D58] mb-6 text-center">Rental Market Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#90C641]">{properties.length}</div>
                  <div className="text-sm text-gray-600">Available Rentals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#90C641]">
                    ₹{Math.min(...(properties || []).map(p => p.monthly_rent).filter(r => r !== null) as number[])?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Starting Rent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#90C641]">
                    {(properties || []).filter(p => p.furnishing_status === 'Fully Furnished').length}
                  </div>
                  <div className="text-sm text-gray-600">Fully Furnished</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#90C641]">
                    {(properties || []).filter(p => p.available_from && new Date(p.available_from) <= new Date()).length}
                  </div>
                  <div className="text-sm text-gray-600">Ready to Move</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}

export default Rent