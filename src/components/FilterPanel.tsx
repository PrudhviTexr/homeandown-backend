import React from 'react';
import StateFilter from './StateFilter';

interface FilterPanelProps {
  filters: {
    state?: string;
    city?: string;
    propertyType?: string;
    commercialSubtype?: string;
    landType?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    minRent?: string;
    maxRent?: string;
    minArea?: string;
    maxArea?: string;
    furnishingStatus?: string;
    facing?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onBatchChange?: (changes: Record<string, string>) => void;
  onClearFilters: () => void;
  listingType?: 'SALE' | 'RENT';
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onBatchChange,
  onClearFilters,
  listingType = 'SALE',
  className = ''
}) => {
  const isRental = listingType === 'RENT';
  
  // Debug logging
  console.log('[FilterPanel] Received filters:', filters);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 mb-8 mt-24 ${className}`}>
      {/* State and City Filters */}
      <div className="mb-4">
        <StateFilter
          selectedState={filters.state || ''}
          selectedCity={filters.city || ''}
          onStateChange={(state) => {
            console.log('[FilterPanel] State change received:', state);
            if (onBatchChange) {
              onBatchChange({ state, city: '' });
            } else {
              onFilterChange('state', state);
              onFilterChange('city', '');
            }
          }}
          onCityChange={(city) => {
            console.log('[FilterPanel] City change received:', city);
            onFilterChange('city', city);
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

        {/* Property Type Filter */}
        <select
          value={filters.propertyType || ''}
          onChange={(e) => {
            console.log('[FilterPanel] Property type changed to:', e.target.value);
            onFilterChange('propertyType', e.target.value);
          }}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Property Types</option>
          <option value="apartment">Apartments</option>
          <option value="commercial">Commercial Properties</option>
          <option value="villa">Villas</option>
          <option value="independent_house">Independent Houses</option>
          <option value="standalone_apartment">Standalone Apartments</option>
          <option value="gated_apartment">Gated Apartments</option>
          <option value="land">Lands & Plots</option>
          <option value="plot">Plots</option>
          <option value="farm_house">Farm Houses</option>
        </select>

        {/* Commercial Subtype Filter - only show if commercial is selected */}
        {filters.propertyType === 'commercial' && (
          <select
            value={filters.commercialSubtype || ''}
            onChange={(e) => onFilterChange('commercialSubtype', e.target.value)}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Commercial Types</option>
            <option value="office">Office</option>
            <option value="retail">Retail</option>
            <option value="warehouse">Warehouse</option>
            <option value="industrial">Industrial</option>
            <option value="shop">Shop</option>
            <option value="showroom">Showroom</option>
          </select>
        )}

        {/* Land Type Filter - only show if land is selected */}
        {filters.propertyType === 'land' && (
          <select
            value={filters.landType || ''}
            onChange={(e) => onFilterChange('landType', e.target.value)}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Land Types</option>
            <option value="residential">Residential</option>
            <option value="agricultural">Agricultural</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
        )}

        {/* Price/Rent Filters */}
        {isRental ? (
          <>
            <input
              type="number"
              placeholder="Min Rent (₹)"
              value={filters.minRent || ''}
              onChange={(e) => onFilterChange('minRent', e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max Rent (₹)"
              value={filters.maxRent || ''}
              onChange={(e) => onFilterChange('maxRent', e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
          </>
        ) : (
          <>
            <input
              type="number"
              placeholder="Min Price (₹)"
              value={filters.minPrice || ''}
              onChange={(e) => {
                console.log('[FilterPanel] Min price changed to:', e.target.value);
                onFilterChange('minPrice', e.target.value);
              }}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max Price (₹)"
              value={filters.maxPrice || ''}
              onChange={(e) => {
                console.log('[FilterPanel] Max price changed to:', e.target.value);
                onFilterChange('maxPrice', e.target.value);
              }}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
          </>
        )}

        {/* Bedrooms Filter */}
        <select
          value={filters.bedrooms || ''}
          onChange={(e) => onFilterChange('bedrooms', e.target.value)}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Beds</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>

        {/* Bathrooms Filter */}
        <select
          value={filters.bathrooms || ''}
          onChange={(e) => onFilterChange('bathrooms', e.target.value)}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Baths</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </div>

      {/* Additional Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Area Filters */}
        <input
          type="number"
          placeholder="Min Area (sqft)"
          value={filters.minArea || ''}
          onChange={(e) => onFilterChange('minArea', e.target.value)}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="Max Area (sqft)"
          value={filters.maxArea || ''}
          onChange={(e) => onFilterChange('maxArea', e.target.value)}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />

        {/* Furnishing Status Filter */}
        <select
          value={filters.furnishingStatus || ''}
          onChange={(e) => {
            console.log('[FilterPanel] Furnishing status changed to:', e.target.value);
            onFilterChange('furnishingStatus', e.target.value);
          }}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Furnishing Status</option>
          <option value="Unfurnished">Unfurnished</option>
          <option value="Semi-Furnished">Semi-Furnished</option>
          <option value="Fully-Furnished">Fully-Furnished</option>
        </select>

        {/* Facing Direction Filter */}
        <select
          value={filters.facing || ''}
          onChange={(e) => onFilterChange('facing', e.target.value)}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Facing Direction</option>
          <option value="north">North</option>
          <option value="south">South</option>
          <option value="east">East</option>
          <option value="west">West</option>
          <option value="northeast">North-East</option>
          <option value="northwest">North-West</option>
          <option value="southeast">South-East</option>
          <option value="southwest">South-West</option>
        </select>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onClearFilters}
          className="bg-[#0ca5e9] text-white px-6 py-3 rounded-lg hover:bg-[#162e5a] transition-colors"
        >
          Clear All Filters
        </button>

        <div className="text-sm text-gray-600 font-medium">
          {isRental ? 'Rental Properties' : 'Properties for Sale'}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;