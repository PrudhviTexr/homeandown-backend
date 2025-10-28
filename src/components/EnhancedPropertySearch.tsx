import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, Home, DollarSign, 
  Bed, Bath, Car, Star, Heart, Eye,
  Calendar, MessageSquare, Phone, Mail
} from 'lucide-react';
import { pyFetch } from '@/utils/backend';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Property {
  id: string;
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  price: number;
  rent?: number;
  city: string;
  state: string;
  zip_code: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  featured: boolean;
  status: string;
  created_at: string;
}

interface SearchFilters {
  query: string;
  city: string;
  state: string;
  property_type: string;
  listing_type: string;
  min_price: string;
  max_price: string;
  min_rent: string;
  max_rent: string;
  bedrooms: string;
  bathrooms: string;
  featured: boolean;
}

const EnhancedPropertySearch: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    city: '',
    state: '',
    property_type: '',
    listing_type: '',
    min_price: '',
    max_price: '',
    min_rent: '',
    max_rent: '',
    bedrooms: '',
    bathrooms: '',
    featured: false
  });

  useEffect(() => {
    fetchProperties();
    fetchSavedProperties();
  }, []);

  const fetchProperties = async (searchFilters?: Partial<SearchFilters>) => {
    try {
      setLoading(true);
      const activeFilters = { ...filters, ...searchFilters };
      
      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await pyFetch(`/api/buyer/properties/search?${params.toString()}`, {
        useApiKey: false
      });
      
      if (response.success) {
        setProperties(response.properties);
      } else {
        toast.error('Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error searching properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedProperties = async () => {
    try {
      const response = await pyFetch('/api/buyer/saved-properties', {
        useApiKey: false
      });
      
      if (response.success) {
        const savedIds = new Set(response.properties.map((p: Property) => p.id));
        setSavedProperties(savedIds);
      }
    } catch (error) {
      console.error('Error fetching saved properties:', error);
    }
  };

  const handleSearch = () => {
    fetchProperties();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      city: '',
      state: '',
      property_type: '',
      listing_type: '',
      min_price: '',
      max_price: '',
      min_rent: '',
      max_rent: '',
      bedrooms: '',
      bathrooms: '',
      featured: false
    });
    fetchProperties({
      query: '',
      city: '',
      state: '',
      property_type: '',
      listing_type: '',
      min_price: '',
      max_price: '',
      min_rent: '',
      max_rent: '',
      bedrooms: '',
      bathrooms: '',
      featured: false
    });
  };

  const toggleSaveProperty = async (propertyId: string) => {
    try {
      const response = await pyFetch('/api/buyer/save-property', {
        method: 'POST',
        body: JSON.stringify({ property_id: propertyId }),
        useApiKey: false
      });
      
      if (response.success) {
        if (response.saved) {
          setSavedProperties(prev => new Set([...prev, propertyId]));
          toast.success('Property saved to favorites');
        } else {
          setSavedProperties(prev => {
            const newSet = new Set(prev);
            newSet.delete(propertyId);
            return newSet;
          });
          toast.success('Property removed from favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling saved property:', error);
      toast.error('Failed to update saved properties');
    }
  };

  const handleQuickInquiry = (property: Property) => {
    navigate(`/property/${property.id}`, { state: { showInquiry: true } });
  };

  const handleBookTour = (property: Property) => {
    navigate(`/property/${property.id}`, { state: { showBooking: true } });
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Main Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by property name, location, or description..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  showFilters 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-5 w-5 inline mr-2" />
                Filters
              </button>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                  <select
                    value={filters.property_type}
                    onChange={(e) => handleFilterChange('property_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type</label>
                  <select
                    value={filters.listing_type}
                    onChange={(e) => handleFilterChange('listing_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                  <input
                    type="number"
                    placeholder="Min price"
                    value={filters.min_price}
                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                  <input
                    type="number"
                    placeholder="Max price"
                    value={filters.max_price}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                  <select
                    value={filters.bathrooms}
                    onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.featured}
                      onChange={(e) => handleFilterChange('featured', e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured Only</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {properties.length} Properties Found
              </h2>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Property Image */}
                    <div className="relative h-48 bg-gray-200">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      {property.featured && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                          <Star className="h-3 w-3 inline mr-1" />
                          Featured
                        </div>
                      )}
                      
                      {/* Save Button */}
                      <button
                        onClick={() => toggleSaveProperty(property.id)}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                          savedProperties.has(property.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${savedProperties.has(property.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Property Details */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                        {property.title}
                      </h3>
                      
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{property.city}, {property.state}</span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xl font-bold text-blue-600">
                          {property.listing_type === 'rent' && property.rent
                            ? `₹${property.rent.toLocaleString()}/month`
                            : formatPrice(property.price)
                          }
                        </div>
                        <div className="text-sm text-gray-600">
                          {property.listing_type === 'rent' ? 'Rent' : 'Sale'}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />
                          <span>{property.bathrooms}</span>
                        </div>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-1" />
                          <span>{property.area} sq ft</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/property/${property.id}`)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4 inline mr-1" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleQuickInquiry(property)}
                          className="px-3 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleBookTour(property)}
                          className="px-3 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors text-sm"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedPropertySearch;
