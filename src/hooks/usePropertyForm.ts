import { useState, useEffect, useCallback } from 'react';
import { pyFetch } from '@/utils/backend';
import { uploadMultipleImages } from '@/utils/imageUpload';
import toast from 'react-hot-toast';

interface PropertyFormHookOptions {
  mode: 'add' | 'edit';
  propertyId?: string;
  userRole: 'seller' | 'agent' | 'admin';
  onSuccess?: () => void;
}

interface PropertyFormHookReturn {
  loading: boolean;
  formData: any;
  setFormData: (data: any) => void;
  saveProperty: (data: any) => Promise<void>;
  deleteProperty: () => Promise<void>;
  fetchPropertyData: () => Promise<any>;
  uploadImages: (files: File[]) => Promise<string[]>;
}

export const usePropertyForm = ({
  mode,
  propertyId,
  userRole,
  onSuccess
}: PropertyFormHookOptions): PropertyFormHookReturn => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Fetch property data for editing
  const fetchPropertyData = useCallback(async () => {
    if (mode === 'edit' && propertyId) {
      try {
        setLoading(true);
        const response = await pyFetch(`/api/properties/${propertyId}`, { useApiKey: true });
        setFormData(response);
        return response;
      } catch (error) {
        console.error('Error fetching property data:', error);
        toast.error('Failed to fetch property data');
        throw error;
      } finally {
        setLoading(false);
      }
    }
    return null;
  }, [mode, propertyId]);

  // Upload images and return URLs
  const uploadImages = useCallback(async (files: File[]): Promise<string[]> => {
    try {
      if (files.length === 0) return [];
      
      const urls = await uploadMultipleImages(files, 'property', 0);
      return urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      throw error;
    }
  }, []);

  // Save property (add or update)
  const saveProperty = useCallback(async (data: any) => {
    try {
      setLoading(true);
      
      // Prepare data for API
      const apiData = {
        ...data,
        added_by_role: userRole
      };

      if (mode === 'add') {
        await pyFetch('/api/properties', {
          method: 'POST',
          useApiKey: true,
          body: JSON.stringify(apiData)
        });
        toast.success('Property added successfully!');
      } else if (mode === 'edit' && propertyId) {
        await pyFetch(`/api/properties/${propertyId}`, {
          method: 'PUT',
          useApiKey: true,
          body: JSON.stringify(apiData)
        });
        toast.success('Property updated successfully!');
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Failed to save property. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mode, propertyId, userRole, onSuccess]);

  // Delete property
  const deleteProperty = useCallback(async () => {
    if (mode === 'edit' && propertyId) {
      try {
        setLoading(true);
        await pyFetch(`/api/properties/${propertyId}`, {
          method: 'DELETE',
          useApiKey: true
        });
        toast.success('Property deleted successfully!');
        onSuccess?.();
      } catch (error) {
        console.error('Error deleting property:', error);
        toast.error('Failed to delete property. Please try again.');
        throw error;
      } finally {
        setLoading(false);
      }
    }
  }, [mode, propertyId, onSuccess]);

  // Load property data on mount for edit mode
  useEffect(() => {
    if (mode === 'edit' && propertyId) {
      fetchPropertyData();
    }
  }, [mode, propertyId, fetchPropertyData]);

  return {
    loading,
    formData,
    setFormData,
    saveProperty,
    deleteProperty,
    fetchPropertyData,
    uploadImages
  };
};
