import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FavoritesApi } from '@/services/favoritesApi';
import Navbar from '@/components/Navbar';
import { Heart, Trash2, MapPin, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface FavoriteProperty {
  id: string;
  property_id: string;
  user_id: string;
  created_at: string;
  property?: {
    id: string;
    title: string;
    description?: string;
    price?: number;
    monthly_rent?: number;
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
    city?: string;
    state?: string;
    images?: string[];
    listing_type?: string;
  };
}

const Wishlist: React.FC = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await FavoritesApi.list(user?.id);
      setFavorites(response.data || response || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favoriteId: string) => {
    try {
      await FavoritesApi.remove(favoriteId);
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Please sign in to view your wishlist</p>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your wishlist...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Heart className="w-8 h-8 text-red-500 mr-3" />
              My Wishlist
            </h1>
            <p className="mt-2 text-gray-600">
              {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} saved
            </p>
          </div>

          {/* Empty State */}
          {favorites.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-6">Start exploring properties and save your favorites here</p>
              <Link 
                to="/buy" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Properties
              </Link>
            </div>
          ) : (
            /* Property Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => {
                const property = favorite.property;
                if (!property) return null;

                const price = property.listing_type === 'rent' ? property.monthly_rent : property.price;
                const priceLabel = property.listing_type === 'rent' ? '/month' : '';
                const mainImage = property.images?.[0] || '/placeholder-property.jpg';

                return (
                  <div key={favorite.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Image */}
                    <Link to={`/property/${property.id}`} className="block relative h-48 bg-gray-200">
                      <img 
                        src={mainImage} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-property.jpg';
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemove(favorite.id);
                        }}
                        className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </Link>

                    {/* Content */}
                    <div className="p-4">
                      <Link to={`/property/${property.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                          {property.title}
                        </h3>
                      </Link>

                      {/* Price */}
                      {price && (
                        <div className="flex items-center text-blue-600 font-bold text-xl mb-2">
                          <DollarSign className="w-5 h-5" />
                          {price.toLocaleString()}
                          <span className="text-sm font-normal text-gray-600 ml-1">{priceLabel}</span>
                        </div>
                      )}

                      {/* Location */}
                      <div className="flex items-center text-gray-600 text-sm mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {property.city}, {property.state}
                      </div>

                      {/* Property Details */}
                      <div className="flex items-center text-gray-600 text-sm space-x-4">
                        {property.bedrooms && (
                          <span>{property.bedrooms} Beds</span>
                        )}
                        {property.bathrooms && (
                          <span>{property.bathrooms} Baths</span>
                        )}
                        {property.property_type && (
                          <span className="capitalize">{property.property_type}</span>
                        )}
                      </div>

                      {/* Description Preview */}
                      {property.description && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                          {property.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Wishlist;
