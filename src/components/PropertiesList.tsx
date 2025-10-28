import React from 'react';
import { FALLBACK_IMAGE } from '@/utils/fallbackImage';
import { MapPin, Bed, Bath, Calendar, Square, Building, Building2, Home, Trees, Car, Zap, Droplets } from 'lucide-react';
import { formatIndianCurrency, formatRent } from '@/utils/currency';

interface PropertyCardProps {
  property: {
    id: string;
    custom_id?: string;
    title: string;
    price?: number | null;
    monthly_rent?: number | null;
    listing_type?: string;
    property_type?: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    balconies?: number | null;
    area_sqft?: number | null;
    area_sqyd?: number | null;
    area_acres?: number | null;
    carpet_area_sqft?: number | null;
    built_up_area_sqft?: number | null;
    plot_area_sqft?: number | null;
    plot_area_sqyd?: number | null;
    rate_per_sqft?: number | null;
    rate_per_sqyd?: number | null;
    commercial_subtype?: string;
    land_type?: string;
    apartment_type?: string;
    bhk_config?: string;
    floor_number?: number | null;
    total_floors?: number | null;
    total_floors_building?: number | null;
    available_floor?: number | null;
    facing?: string;
    furnishing_status?: string;
    amenities?: string[];
    address: string;
    city: string;
    state?: string;
    district?: string;
    mandal?: string;
    created_at?: string;
    available_from?: string | null;
    images: string[];
    sections?: any[];
  };
  onPropertyClick: (id: string, title?: string) => void;
  showMap?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onPropertyClick, 
  showMap = false 
}) => {
  const isRental = property.listing_type === 'RENT' || property.monthly_rent;
  const price = isRental ? property.monthly_rent : property.price;
  const priceDisplay = isRental 
    ? formatRent(price ?? 0) 
    : formatIndianCurrency(price || 0);

  // Calculate rate per sq ft/sq yd display
  const getRateDisplay = () => {
    if (property.rate_per_sqft) {
      return `₹${property.rate_per_sqft.toLocaleString('en-IN')}/sqft`;
    }
    if (property.rate_per_sqyd) {
      return `₹${property.rate_per_sqyd.toLocaleString('en-IN')}/sqyd`;
    }
    return null;
  };

  const rateDisplay = getRateDisplay();

  // Get area display based on property type
  const getAreaDisplay = () => {
    if (property.property_type === 'land' || property.property_type === 'plot') {
      if (property.plot_area_sqft) return `${property.plot_area_sqft} sqft`;
      if (property.area_sqft) return `${property.area_sqft} sqft`;
      if (property.area_sqyd) return `${property.area_sqyd} sq.yd`;
      if (property.area_acres) return `${property.area_acres} acres`;
      if (property.plot_area_sqyd) return `${property.plot_area_sqyd} sq.yd`;
    }
    if (property.area_sqft) return `${property.area_sqft} sqft`;
    if (property.carpet_area_sqft) return `${property.carpet_area_sqft} sqft (Carpet)`;
    if (property.built_up_area_sqft) return `${property.built_up_area_sqft} sqft (Built-up)`;
    return null;
  };

  const areaDisplay = getAreaDisplay();

  // Get property type icon
  const getPropertyIcon = () => {
    switch (property.property_type) {
      case 'commercial': return <Building className="w-4 h-4" />;
      case 'villa': return <Home className="w-4 h-4" />;
      case 'independent_house': return <Home className="w-4 h-4" />;
      case 'land': return <Trees className="w-4 h-4" />;
      case 'plot': return <Square className="w-4 h-4" />;
      case 'farm_house': return <Trees className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`professional-card overflow-hidden cursor-pointer card-hover ${
        showMap ? 'flex' : 'flex flex-col'
      }`}
      onClick={() => onPropertyClick(property.id, property.title)}
    >
      <img
        src={(property.images && property.images[0]) || FALLBACK_IMAGE}
        alt={property.title}
        className={`object-cover ${showMap ? 'w-1/3 h-full' : 'w-full h-48'} bg-gray-100`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
        }}
      />
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getPropertyIcon()}
            <span className="text-sm font-medium text-gray-600 capitalize">
              {property.property_type?.replace('_', ' ')}
            </span>
          </div>
          {property.custom_id && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {property.custom_id}
            </span>
          )}
        </div>

        <h3 className={`font-semibold mb-1 ${showMap ? 'text-lg' : 'text-xl'}`}>
          {property.title}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <p className="text-[#90C641] font-bold text-xl">
            {priceDisplay}
          </p>
          {rateDisplay && (
            <span className="text-sm text-gray-600">
              ({rateDisplay})
            </span>
          )}
        </div>

        <div className={`flex items-center text-sm text-gray-600 gap-4 mb-2 ${showMap ? '' : 'justify-center'}`}>
          {/* Property specific details */}
          {property.property_type === 'land' || property.property_type === 'plot' ? (
            <span className="flex items-center gap-1">
              <Square size={14} /> {areaDisplay}
            </span>
          ) : property.property_type === 'commercial' ? (
            <>
              <span className="flex items-center gap-1">
                <Building size={14} /> {property.commercial_subtype || 'Office'}
              </span>
              {property.total_floors && (
                <span className="flex items-center gap-1">
                  <Building2 size={14} /> {property.total_floors} Floors
                </span>
              )}
              {areaDisplay && (
                <span className="flex items-center gap-1">
                  <Square size={14} /> {areaDisplay}
                </span>
              )}
            </>
          ) : (
            <>
              {property.bedrooms && (
                <span className="flex items-center gap-1">
                  <Bed size={14} /> {property.bedrooms}
                </span>
              )}
              {property.bathrooms && (
                <span className="flex items-center gap-1">
                  <Bath size={14} /> {property.bathrooms}
                </span>
              )}
              {areaDisplay && (
                <span className="flex items-center gap-1">
                  <Square size={14} /> {areaDisplay}
                </span>
              )}
            </>
          )}

          {/* Amenities indicators */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex gap-1">
              {property.amenities.includes('Parking') && <Car size={14} className="text-green-600" />}
              {property.amenities.includes('Power Backup') && <Zap size={14} className="text-yellow-600" />}
              {property.amenities.includes('Water') && <Droplets size={14} className="text-blue-600" />}
            </div>
          )}

          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {property.available_from
              ? new Date(property.available_from).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : property.created_at
              ? new Date(property.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A'}
          </span>
        </div>

        {/* Additional details for specific property types */}
        <div className={`text-xs text-gray-500 mb-3 ${showMap ? '' : 'text-center'}`}>
          {property.property_type === 'commercial' && property.available_floor && (
            <span>Floor {property.available_floor} • </span>
          )}
          {property.apartment_type && (
            <span>{property.apartment_type} • </span>
          )}
          {property.bhk_config && (
            <span>{property.bhk_config} • </span>
          )}
          {property.furnishing_status && property.furnishing_status !== 'Unfurnished' && (
            <span>{property.furnishing_status} • </span>
          )}
          {property.facing && (property.property_type === 'independent_house' || property.property_type === 'villa') && (
            <span>{property.facing} facing • </span>
          )}
          {property.floor_number && property.total_floors_building && (
            <span>{property.floor_number}/{property.total_floors_building} floor</span>
          )}
        </div>

        <p className={`text-gray-600 text-sm mb-3 flex items-center gap-1 ${showMap ? '' : 'justify-center'}`}>
          <MapPin size={16} />
          {property.address}, {property.city}
          {property.district && `, ${property.district}`}
        </p>

        {/* Show preview of first custom section if available */}
        {property.sections && property.sections.length > 0 && (
          <div className="text-sm text-gray-600 italic border-t pt-2">
            <strong>{property.sections[0].title}:</strong> {property.sections[0].content?.substring(0, 100)}...
          </div>
        )}

        <div className={showMap ? '' : 'text-center'}>
          <button className="bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7ba539] transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

interface PropertiesListProps {
  properties: PropertyCardProps['property'][];
  onPropertyClick: (id: string, title?: string) => void;
  showMap?: boolean;
  loading?: boolean;
  error?: string | null;
  listingType?: string;
}

const PropertiesList: React.FC<PropertiesListProps> = ({ 
  properties, 
  onPropertyClick, 
  showMap = false,
  loading = false,
  error = null,
  listingType = 'SALE'
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg font-medium">{error}</p>
        <p className="text-gray-500 mt-2">Try adjusting your search criteria or refresh the page.</p>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">
          No {listingType === 'RENT' ? 'rental ' : ''}properties available.
        </p>
        <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  return (
    <div className={`${showMap ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'}`}>
      {(properties || []).map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onPropertyClick={onPropertyClick}
          showMap={showMap}
        />
      ))}
    </div>
  );
};

export default PropertiesList;