import { pyFetch } from '@/utils/backend';

export interface FavoriteProperty {
  id: string;
  property_id: string;
  user_id: string;
  created_at: string;
  property?: any;
}

export const FavoritesApi = {
  async list(userId?: string): Promise<FavoriteProperty[]> {
    try {
      const response = await pyFetch('/api/favorites', {
        method: 'GET',
        useApiKey: false,
      });
      return response || [];
    } catch (error) {
      console.error('[FavoritesApi] Error fetching favorites:', error);
      return [];
    }
  },

  async add(propertyId: string): Promise<void> {
    try {
      await pyFetch('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ property_id: propertyId }),
        useApiKey: false,
      });
    } catch (error) {
      console.error('[FavoritesApi] Error adding favorite:', error);
      throw error;
    }
  },

  async remove(favoriteId: string): Promise<void> {
    try {
      await pyFetch(`/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        useApiKey: false,
      });
    } catch (error) {
      console.error('[FavoritesApi] Error removing favorite:', error);
      throw error;
    }
  },
};
