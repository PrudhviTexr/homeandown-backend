import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { uploadMultipleImages } from '@/utils/imageUpload';
import { pyFetch } from '@/utils/backend';
import toast from 'react-hot-toast';
import LocationSelectorManual from '@/components/LocationSelectorManual';
import { Property as DatabaseProperty } from '@/types/database';

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyUpdated: () => void;
  property: DatabaseProperty | null;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  custom_id: string;
  user_type: string;
  business_name?: string | null;
  email?: string | null;
  label?: string;
}

const EditPropertyModal: React.FC<EditPropertyModalProps> = ({ isOpen, onClose, onPropertyUpdated, property }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [amenities, setAmenities] = useState<string[]>(['']);
  const [sections, setSections] = useState<{ title: string; content: string }[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [locationData, setLocationData] = useState({
    state: '',
    district: '',
    mandal: ''
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    monthly_rent: '',
    security_deposit: '',
    maintenance_charges: '',
    rate_per_sqft: '',
    rate_per_sqyd: '',
    property_type: 'apartment',
    bedrooms: '',
    bathrooms: '',
    balconies: '',
    area_sqft: '',
    area_sqyd: '',
    area_acres: '',
    carpet_area_sqft: '',
    built_up_area_sqft: '',
    plot_area_sqft: '',
    plot_area_sqyd: '',
    commercial_subtype: '',
    total_floors: '',
    floor: '',
    parking_spaces: '',
    bhk_config: '',
    floor_count: '',
    facing: '',
    private_garden: false,
    private_driveway: false,
    plot_dimensions: '',
    land_type: '',
    soil_type: '',
    road_access: true,
    boundary_fencing: false,
    water_availability: false,
    electricity_availability: false,
    corner_plot: false,
    water_source: '',
    apartment_type: '',
    community_type: '',
    gated_community_features: [],
    visitor_parking: false,
    furnishing_status: 'Unfurnished',
    legal_status: '',
    rera_status: '',
    rera_number: '',
    nearby_business_hubs: '',
    nearby_transport: '',
    address: '',
    city: '',
    state: '',
    state_id: '',
    district_id: '',
    mandal_id: '',
    zip_code: '',
    latitude: '',
    longitude: '',
    owner_id: '',
    status: 'active',
    featured: false,
    listing_type: 'SALE',
    available_from: '',
    possession_date: '',
    custom_id: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (property) {
        console.log('[EditPropertyModal] Loading property data:', property);
        console.log('[EditPropertyModal] Property images:', property.images);
        setFormData({
          title: property.title || '',
          description: property.description || '',
          price: property.price?.toString() || '',
          monthly_rent: property.monthly_rent?.toString() || '',
          security_deposit: property.security_deposit?.toString() || '',
          maintenance_charges: property.maintenance_charges?.toString() || '',
          rate_per_sqft: property.rate_per_sqft?.toString() || '',
          rate_per_sqyd: property.rate_per_sqyd?.toString() || '',
          property_type: property.property_type || 'standalone_apartment',
          bedrooms: property.bedrooms?.toString() || '',
          bathrooms: property.bathrooms?.toString() || '',
          balconies: property.balconies?.toString() || '',
          area_sqft: property.area_sqft?.toString() || '',
          area_sqyd: property.area_sqyd?.toString() || '',
          area_acres: property.area_acres?.toString() || '',
          carpet_area_sqft: property.carpet_area_sqft?.toString() || '',
          built_up_area_sqft: property.built_up_area_sqft?.toString() || '',
          plot_area_sqft: property.plot_area_sqft?.toString() || '',
          plot_area_sqyd: property.plot_area_sqyd?.toString() || '',
          commercial_subtype: property.commercial_subtype || '',
          total_floors: property.total_floors?.toString() || '',
          floor: property.floor?.toString() || '',
          parking_spaces: property.parking_spaces?.toString() || '',
          bhk_config: property.bhk_config || '',
          floor_count: property.floor_count?.toString() || '',
          facing: property.facing || '',
          private_garden: property.private_garden || false,
          private_driveway: property.private_driveway || false,
          plot_dimensions: property.plot_dimensions || '',
          land_type: property.land_type || '',
          soil_type: property.soil_type || '',
          road_access: property.road_access !== undefined ? property.road_access : true,
          boundary_fencing: property.boundary_fencing || false,
          water_availability: property.water_availability || false,
          electricity_availability: property.electricity_availability || false,
          corner_plot: property.corner_plot || false,
          water_source: property.water_source || '',
          apartment_type: property.apartment_type || '',
          community_type: property.community_type || '',
          gated_community_features: property.gated_community_features || [],
          visitor_parking: property.visitor_parking || false,
          furnishing_status: property.furnishing_status || 'Unfurnished',
          legal_status: property.legal_status || '',
          rera_status: property.rera_status || '',
          rera_number: property.rera_number || '',
          nearby_business_hubs: property.nearby_business_hubs || '',
          nearby_transport: property.nearby_transport || '',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          state_id: property.state_id || '',
          district_id: property.district_id || '',
          mandal_id: property.mandal_id || '',
          zip_code: property.zip_code || '',
          latitude: property.latitude?.toString() || '',
          longitude: property.longitude?.toString() || '',
          owner_id: property.owner_id || '',
          status: property.status || 'active',
          featured: property.featured || false,
          verified: property.verified || false,
          listing_type: property.listing_type || 'SALE',
          available_from: property.available_from || '',
          possession_date: property.possession_date || '',
          custom_id: property.custom_id || '',
        });
        
        setAmenities(property.amenities?.length ? property.amenities : ['']);
        console.log('[EditPropertyModal] Setting existing images:', property.images || []);
        setExistingImages(property.images || []);
        setSections(property.sections?.length ? property.sections : []);
        
        // Set location data if available - use text values, not IDs
        setLocationData({
          state: property.state || '',
          district: property.district || '',
          mandal: property.mandal || ''
        });
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setFormData(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString() }));
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  }, [isOpen, property]);

  // Auto-set listing type to SALE for plots
  useEffect(() => {
    if (formData.property_type === 'plot' && formData.listing_type !== 'SALE') {
      setFormData(prev => ({ ...prev, listing_type: 'SALE' }));
    }
  }, [formData.property_type]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users for property owner dropdown...');
      const { AdminApi } = await import('@/services/pyApi');
      const all = (await AdminApi.users()) as any[];
      const filtered = (all || []).filter(u => ['seller', 'agent'].includes(String(u.user_type || '').toLowerCase()) && (u.status || 'active') === 'active');
      console.log('Fetched users:', filtered.length || 0);
      setUsers(filtered.map(u => {
        const business = (u.business_name || u.owner_name || '').trim();
        const name = ((u.first_name || '') + ' ' + (u.last_name || '')).trim();
        const label = business || name || u.email || (u.custom_id ? `ID ${u.custom_id}` : 'Owner');
        return {
          id: String(u.id),
          first_name: u.first_name,
          last_name: u.last_name,
          custom_id: u.custom_id,
          user_type: u.user_type,
          business_name: business || null,
          email: u.email || null,
          label,
        };
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      // Add fallback data if no users are found
      setUsers([
        {
          id: '11111111-1111-1111-1111-111111111111',
          first_name: 'Demo',
          last_name: 'Seller',
          custom_id: 'SELLER001',
          user_type: 'seller'
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          first_name: 'Demo',
          last_name: 'Agent',
          custom_id: 'AGENT001',
          user_type: 'agent'
        }
      ]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Don't trigger pincode auto-population during typing - only on blur
      // This prevents interference with input field
    }
  };

  // Handle pincode auto-population on blur
  const handlePincodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // Only auto-populate when pincode is exactly 6 digits and user finishes typing
    if (value && value.length === 6 && /^\d{6}$/.test(value)) {
      await handlePincodeAutoPopulation(value);
    }
  };

  const handlePincodeAutoPopulation = async (pincode: string) => {
    try {
      console.log('[EditPropertyModal] Fetching location data for pincode:', pincode);
      
      // Call the pincode API endpoint using pyFetch
      const response = await pyFetch(`/api/properties/pincode/${pincode}/suggestions`, { useApiKey: true });
      
      if (response && response.suggestions) {
        const suggestions = response.suggestions;
        console.log('[EditPropertyModal] Pincode data received:', suggestions);
        
        // Auto-populate form fields with suggested values
        setFormData(prev => ({
          ...prev,
          state: suggestions.state || prev.state,
          district: suggestions.district || prev.district,
          mandal: suggestions.mandal || prev.mandal,
          city: suggestions.city || prev.city,
          address: suggestions.address || prev.address,
          latitude: suggestions.latitude?.toString() || prev.latitude,
          longitude: suggestions.longitude?.toString() || prev.longitude
        }));
        
        // Also update location data for the LocationSelectorManual
        setLocationData(prev => ({
          ...prev,
          state: suggestions.state || prev.state,
          district: suggestions.district || prev.district,
          mandal: suggestions.mandal || prev.mandal
        }));
        
        console.log('[EditPropertyModal] Form fields auto-populated successfully');
      }
    } catch (error) {
      console.error('[EditPropertyModal] Error fetching pincode data:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter out disallowed file types
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const allowedFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (allowedFiles.length < files.length) {
      toast.error('Some files were skipped. Only PNG, JPG, and JPEG files are allowed for property images.');
    }
    
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAmenityChange = (index: number, value: string) => {
    setAmenities(prev => prev.map((amenity, i) => i === index ? value : amenity));
  };

  const addAmenity = () => {
    setAmenities(prev => [...prev, '']);
  };
  const addSection = () => setSections(prev => [...prev, { title: '', content: '' }]);
  const updateSection = (i: number, key: 'title' | 'content', value: string) => setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: value } : s));
  const removeSection = (i: number) => setSections(prev => prev.filter((_, idx) => idx !== i));

  const removeAmenity = (index: number) => {
    setAmenities(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationChange = async (field: string, value: string) => {
    setLocationData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update form data with location info - value is now the text name, not ID
    if (field === 'state') {
      setFormData(prev => ({ ...prev, state: value }));
      
      // Try to get the state ID from the name
      try {
        const { LocationService } = await import('@/services/locationService');
        const states = await LocationService.getStates();
        const stateObj = states.find(s => s.name === value);
        if (stateObj) {
          setFormData(prev => ({ ...prev, state_id: stateObj.id }));
        }
      } catch (error) {
        console.error('Error fetching state ID:', error);
      }
    } else if (field === 'district') {
      setFormData(prev => ({ ...prev, district: value }));
      
      // Try to get the district ID from the name
      try {
        const { LocationService } = await import('@/services/locationService');
        const districts = await LocationService.getDistrictsForState(locationData.state);
        const districtObj = districts.find(d => d.name === value);
        if (districtObj) {
          setFormData(prev => ({ ...prev, district_id: districtObj.id }));
        }
      } catch (error) {
        console.error('Error fetching district ID:', error);
      }
    } else if (field === 'mandal') {
      setFormData(prev => ({ ...prev, mandal: value }));
      
      // Try to get the mandal ID from the name
      try {
        const { LocationService } = await import('@/services/locationService');
        const mandals = await LocationService.getMandalsForDistrict(locationData.state, locationData.district);
        const mandalObj = mandals.find(m => m.name === value);
        if (mandalObj) {
          setFormData(prev => ({ ...prev, mandal_id: mandalObj.id }));
        }
      } catch (error) {
        console.error('Error fetching mandal ID:', error);
      }
    }
  };

  const uploadImages = async (propertyId: string) => {
    const imageUrls: string[] = [...existingImages];
    
    if (images.length > 0) { 
      try {
        console.log(`Uploading ${images.length} new images for property ${propertyId}...`);
        const newImageUrls = await uploadMultipleImages(images, 'property', Number(propertyId));
        
        console.log('Uploaded new image URLs:', newImageUrls);
        
        // Add new URLs to existing ones
        imageUrls.push(...newImageUrls);
      } catch (error) {
        console.error('Error uploading images:', error);
        throw error;
      }
    }

    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[EditPropertyModal] Form submitted!');
    console.log('[EditPropertyModal] Property:', property);
    console.log('[EditPropertyModal] Form data:', formData);
    
    if (!property) {
      console.error('[EditPropertyModal] No property found!');
      toast.error('No property data found');
      return;
    }
    
    setLoading(true);
    const timestamp = new Date().toISOString();
    console.log('[EditPropertyModal] Starting property update process...');

    try {
      // Prepare property data
      const propertyData: any = {
        title: formData.title,
        description: formData.description,
        price: formData.listing_type === 'SALE' ? parseFloat(formData.price) || null : null,
        monthly_rent: formData.listing_type === 'RENT' ? parseFloat(formData.monthly_rent) || null : null,
        security_deposit: formData.listing_type === 'RENT' ? parseFloat(formData.security_deposit) || null : null,
        maintenance_charges: parseFloat(formData.maintenance_charges) || null,
        rate_per_sqft: parseFloat(formData.rate_per_sqft) || null,
        rate_per_sqyd: parseFloat(formData.rate_per_sqyd) || null,
        property_type: formData.property_type,
        bedrooms: parseInt(formData.bedrooms) || null,
        bathrooms: parseInt(formData.bathrooms) || null,
        balconies: parseInt(formData.balconies) || null,
        area_sqft: parseFloat(formData.area_sqft) || null,
        area_sqyd: parseFloat(formData.area_sqyd) || null,
        area_acres: parseFloat(formData.area_acres) || null,
        carpet_area_sqft: parseFloat(formData.carpet_area_sqft) || null,
        built_up_area_sqft: parseFloat(formData.built_up_area_sqft) || null,
        plot_area_sqft: parseFloat(formData.plot_area_sqft) || null,
        plot_area_sqyd: parseFloat(formData.plot_area_sqyd) || null,
        commercial_subtype: formData.commercial_subtype || null,
        total_floors: parseInt(formData.total_floors) || null,
        floor: parseInt(formData.floor) || null,
        parking_spaces: parseInt(formData.parking_spaces) || null,
        bhk_config: formData.bhk_config || null,
        floor_count: parseInt(formData.floor_count) || null,
        facing: formData.facing || null,
        private_garden: formData.private_garden,
        private_driveway: formData.private_driveway,
        plot_dimensions: formData.plot_dimensions || null,
        land_type: formData.land_type || null,
        soil_type: formData.soil_type || null,
        road_access: formData.road_access,
        boundary_fencing: formData.boundary_fencing,
        water_availability: formData.water_availability,
        electricity_availability: formData.electricity_availability,
        corner_plot: formData.corner_plot,
        water_source: formData.water_source || null,
        apartment_type: formData.apartment_type || null,
        community_type: formData.community_type || null,
        gated_community_features: formData.gated_community_features,
        visitor_parking: formData.visitor_parking,
        furnishing_status: formData.furnishing_status,
        amenities: amenities.filter(a => a.trim() !== ''),
        legal_status: formData.legal_status || null,
        rera_status: formData.rera_status || null,
        rera_number: formData.rera_number || null,
        nearby_business_hubs: formData.nearby_business_hubs || null,
        nearby_transport: formData.nearby_transport || null,
        address: formData.address,
        city: formData.city,
        state: formData.state || 'NA',
        state_id: locationData.state || formData.state_id || '',
        district: locationData.district || formData.district || '',
        district_id: locationData.district || formData.district_id || '',
        mandal: locationData.mandal || formData.mandal || '',
        mandal_id: locationData.mandal || formData.mandal_id || '',
        zip_code: formData.zip_code,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null,
        owner_id: formData.owner_id || null,
        status: formData.status,
        featured: formData.featured,
        verified: formData.verified,
        listing_type: formData.listing_type,
        available_from: formData.available_from || null,
        updated_at: timestamp
      };
      
      // Validate UUID fields before sending
      const uuidFields = ['owner_id'];
      for (const field of uuidFields) {
        if (propertyData[field] && typeof propertyData[field] === 'string') {
          // UUID regex pattern
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidPattern.test(propertyData[field])) {
            toast.error(`Invalid ${field.replace('_', ' ')} format. Please select a valid owner.`);
            setLoading(false);
            return;
          }
        }
      }

      // Update property via Python API
      console.log('[EditPropertyModal] Updating property with data:', propertyData);
      console.log('[EditPropertyModal] Property ID:', property.id);
      console.log('[EditPropertyModal] API URL:', `/api/properties/${property.id}`);
      
      const updateResponse = await pyFetch(`/api/properties/${property.id}`, { method: 'PUT', useApiKey: true, body: JSON.stringify(propertyData) });
      console.log('[EditPropertyModal] Update response:', updateResponse);

      // Upload new images if any
      if (images.length > 0) {
        console.log('[EditPropertyModal] Uploading new images...');
        const imageUrls = await uploadImages(property.id);
        console.log('[EditPropertyModal] All image URLs:', imageUrls);
        
        // Update property with image URLs via Python API
        console.log('[EditPropertyModal] Updating property with image URLs...');
        const imageUpdateResponse = await pyFetch(`/api/properties/${property.id}`, { method: 'PATCH', useApiKey: true, body: JSON.stringify({ images: imageUrls }) });
        console.log('[EditPropertyModal] Image update response:', imageUpdateResponse);
        
        console.log('[EditPropertyModal] Property updated with image URLs');
      } else if (existingImages.length !== property.images?.length) {
        // Update property with modified existing images
        console.log('[EditPropertyModal] Updating property with modified existing images...');
        const existingImageUpdateResponse = await pyFetch(`/api/properties/${property.id}`, { method: 'PATCH', useApiKey: true, body: JSON.stringify({ images: existingImages }) });
        console.log('[EditPropertyModal] Existing image update response:', existingImageUpdateResponse);
        
        console.log('[EditPropertyModal] Property updated with modified existing images');
      }

      onPropertyUpdated();
      onClose();
      toast.success('Property updated successfully!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        monthly_rent: '',
        security_deposit: '',
        maintenance_charges: '',
        rate_per_sqft: '',
        rate_per_sqyd: '',
        property_type: 'standalone_apartment',
        bedrooms: '',
        bathrooms: '',
        balconies: '',
        area_sqft: '',
        area_sqyd: '',
        area_acres: '',
        carpet_area_sqft: '',
        built_up_area_sqft: '',
        plot_area_sqft: '',
        plot_area_sqyd: '',
        commercial_subtype: '',
        total_floors: '',
        floor: '',
        parking_spaces: '',
        bhk_config: '',
        floor_count: '',
        facing: '',
        private_garden: false,
        private_driveway: false,
        plot_dimensions: '',
        land_type: '',
        soil_type: '',
        road_access: true,
        boundary_fencing: false,
        water_availability: false,
        electricity_availability: false,
        corner_plot: false,
        water_source: '',
        apartment_type: '',
        community_type: '',
        gated_community_features: [],
        visitor_parking: false,
        furnishing_status: 'Unfurnished',
        legal_status: '',
        rera_status: '',
        rera_number: '',
        nearby_business_hubs: '',
        nearby_transport: '',
        address: '',
        city: '',
        state: '',
        state_id: '',
        district_id: '',
        mandal_id: '',
        zip_code: '',
        latitude: '',
        longitude: '',
        owner_id: '',
        status: 'active',
        featured: false,
        verified: false,
        listing_type: 'SALE',
        available_from: '',
        possession_date: '',
        custom_id: '',
      });
      setImages([]);
      setAmenities(['']);
      setExistingImages([]);

    } catch (error) {
      console.error('[EditPropertyModal] Error updating property:', error);
      console.error('[EditPropertyModal] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error('Failed to update property. Please try again.');
    } finally {
      console.log('[EditPropertyModal] Update process completed');
      setLoading(false);
    }
  };

  const renderPropertySpecificFields = () => {
    switch (formData.property_type) {
      case 'standalone_apartment':
      case 'gated_apartment':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Apartment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Floor Number</label>
                <input type="number" name="floor" value={formData.floor} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Floors in Building</label>
                <input type="number" name="total_floors" value={formData.total_floors} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Area (sqft)</label>
                <input type="number" name="area_sqft" value={formData.area_sqft} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>
          </div>
        );

      case 'independent_house':
      case 'villa':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">House/Villa Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Floor Count</label>
                <input type="number" name="floor_count" value={formData.floor_count} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facing</label>
                <select name="facing" value={formData.facing} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Plot Area (sqft)</label>
                <input type="number" name="plot_area_sqft" value={formData.plot_area_sqft} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Built-up Area (sqft)</label>
                <input type="number" name="built_up_area_sqft" value={formData.built_up_area_sqft} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        );

      case 'commercial':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Commercial Property Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commercial Subtype</label>
                <select name="commercial_subtype" value={formData.commercial_subtype} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Type</option>
                  <option value="office">Office</option>
                  <option value="retail">Retail</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="showroom">Showroom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Floors</label>
                <input type="number" name="total_floors" value={formData.total_floors} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Floor</label>
                <input type="number" name="floor" value={formData.floor} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parking Spaces</label>
                <input type="number" name="parking_spaces" value={formData.parking_spaces} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Area (sqft)</label>
                <input type="number" name="area_sqft" value={formData.area_sqft} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>
          </div>
        );

      case 'land':
      case 'plot':
      case 'farm_house':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Land/Plot Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Land Type</label>
                <select name="land_type" value={formData.land_type} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="agricultural">Agricultural</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
                <select name="soil_type" value={formData.soil_type} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Soil Type</option>
                  <option value="black">Black Soil</option>
                  <option value="red">Red Soil</option>
                  <option value="alluvial">Alluvial Soil</option>
                  <option value="laterite">Laterite Soil</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Plot Area (sqft)</label>
                <input type="number" name="plot_area_sqft" value={formData.plot_area_sqft} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Plot Area (sqyd)</label>
                <input type="number" name="plot_area_sqyd" value={formData.plot_area_sqyd} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Corner Plot</label>
                <input type="checkbox" name="corner_plot" checked={formData.corner_plot} onChange={handleInputChange} className="mr-2" />
                <span className="text-sm text-gray-600">Yes</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Water Source</label>
                <input type="text" name="water_source" value={formData.water_source} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Borewell, Municipal" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPricingSection = () => {
    if (formData.listing_type === 'SALE') {
      return (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing (For Sale)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Price (₹) *</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate per Sq.Ft (₹)</label>
              <input type="number" name="rate_per_sqft" value={formData.rate_per_sqft} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate per Sq.Yd (₹)</label>
              <input type="number" name="rate_per_sqyd" value={formData.rate_per_sqyd} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing (For Rent)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent (₹) *</label>
              <input type="number" name="monthly_rent" value={formData.monthly_rent} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹)</label>
              <input type="number" name="security_deposit" value={formData.security_deposit} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Charges (₹)</label>
              <input type="number" name="maintenance_charges" value={formData.maintenance_charges} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      );
    }
  };

  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Edit Property</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Type *
                      </label>
                      <select
                        name="property_type"
                        value={formData.property_type}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="standalone_apartment">Standalone Apartment</option>
                        <option value="gated_apartment">Gated Apartment</option>
                        <option value="independent_house">Independent House</option>
                        <option value="villa">Villa</option>
                        <option value="commercial">Commercial Property</option>
                        <option value="land">Land</option>
                        <option value="plot">Plot</option>
                        <option value="farm_house">Farm House</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Listing Type *
                      </label>
                      <select
                        name="listing_type"
                        value={formData.listing_type}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={['plot', 'land'].includes(formData.property_type)}
                      >
                        <option value="SALE">For Sale</option>
                        {!['plot', 'land'].includes(formData.property_type) && <option value="RENT">For Rent</option>}
                      </select>
                      {['plot', 'land'].includes(formData.property_type) && (
                        <p className="text-xs text-gray-500 mt-1">Land/Plots are only available for sale</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {formData.property_type !== 'plot' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bedrooms
                        </label>
                        <input
                          type="number"
                          name="bedrooms"
                          value={formData.bedrooms}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {formData.property_type !== 'plot' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bathrooms
                        </label>
                        <input
                          type="number"
                          name="bathrooms"
                          value={formData.bathrooms}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div className={formData.property_type === 'plot' ? 'col-span-3' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Area ({formData.property_type === 'plot' ? 'sqft' : 'sqft'}) *
                      </label>
                      <input
                        type="number"
                        name="area_sqft"
                        value={formData.area_sqft}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Property-Specific Details */}
              {renderPropertySpecificFields()}

              {/* Pricing */}
              <div>
                {renderPricingSection()}
              </div>

              {/* Amenities */}
              {formData.property_type !== 'plot' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                  
                  <div className="space-y-2">
                    {amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={amenity}
                          onChange={(e) => handleAmenityChange(index, e.target.value)}
                          placeholder="Enter amenity"
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        {amenities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAmenity(index)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addAmenity}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Amenity
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Sections (Flexible for plots/lands and others) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Sections (optional)</h3>
                <p className="text-sm text-gray-500 mb-3">Add or edit headings and free text (or PDF links) for plots, farms or property-specific details. Headings render bold.</p>
                <div className="space-y-3">
                  {sections.map((s, i) => (
                    <div key={i} className="space-y-2 border p-3 rounded">
                      <input
                        type="text"
                        placeholder="Section title"
                        value={s.title}
                        onChange={(e) => updateSection(i, 'title', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                      <textarea
                        placeholder="Content or link to PDF"
                        value={s.content}
                        onChange={(e) => updateSection(i, 'content', e.target.value)}
                        className="w-full p-2 border rounded h-24"
                      />
                      <div className="flex justify-end">
                        <button type="button" onClick={() => removeSection(i)} className="text-red-600">Remove</button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <button type="button" onClick={addSection} className="text-blue-600">+ Add Section</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                
                <div className="space-y-4">
                  {/* Location Selector */}
                  <LocationSelectorManual
                    key={`edit-location-${property?.id || 'new'}-${formData.zip_code || 'empty'}`}
                    selectedState={locationData.state}
                    selectedDistrict={locationData.district}
                    selectedMandal={locationData.mandal}
                    onStateChange={(value) => handleLocationChange('state', value)}
                    onDistrictChange={(value) => handleLocationChange('district', value)}
                    onMandalChange={(value) => handleLocationChange('mandal', value)}
                    required={true}
                    formData={formData}
                    setFormData={setFormData}
                    handleInputChange={handleInputChange}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City/Area *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter specific area/locality"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={(e) => {
                          const pincode = e.target.value;
                          
                          // Only allow numeric input
                          const numericPincode = pincode.replace(/\D/g, '');
                          
                          // Update form data directly without any interference
                          setFormData(prev => ({
                            ...prev,
                            zip_code: numericPincode
                          }));
                          
                          // Don't call handleInputChange to avoid any interference
                          // Auto-population will happen on blur
                        }}
                        onBlur={handlePincodeBlur}
                        onKeyDown={(e) => {
                          // Allow backspace, delete, tab, escape, enter
                          if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                              // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                              (e.keyCode === 65 && e.ctrlKey === true) ||
                              (e.keyCode === 67 && e.ctrlKey === true) ||
                              (e.keyCode === 86 && e.ctrlKey === true) ||
                              (e.keyCode === 88 && e.ctrlKey === true) ||
                              // Allow home, end, left, right
                              (e.keyCode >= 35 && e.keyCode <= 40)) {
                            return;
                          }
                          // Ensure that it is a number and stop the keypress
                          if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="any"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((pos) => {
                                setFormData(prev => ({ ...prev, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() }));
                              });
                            }
                          }}
                          className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100"
                        >GPS</button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner and Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner & Status</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Owner *
                    </label>
                    <div className="relative">
                      <select
                        name="owner_id"
                        value={formData.owner_id}
                        onChange={handleInputChange} 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Owner</option>
                        <option value="homeandown">Home & Own (Platform)</option>
                        {users && users.length > 0 && (
                          users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.label} {user.user_type ? `- ${user.user_type}` : ''}
                            </option>
                          ))
                        )}
                      </select>
                      {(!users || users.length === 0) && (
                        <p className="text-sm text-red-500 mt-1">No property owners available. Please add a seller or agent first.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="sold">Sold</option>
                        <option value="rented">Rented</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Furnishing Status
                      </label>
                      <select
                        name="furnishing_status"
                        value={formData.furnishing_status}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Unfurnished">Unfurnished</option>
                        <option value="Semi Furnished">Semi Furnished</option>
                        <option value="Fully Furnished">Fully Furnished</option>
                      </select>
                    </div>
                  </div>

                  {formData.listing_type === 'RENT' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available From
                      </label>
                      <input
                        type="date"
                        name="available_from"
                        value={formData.available_from}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Featured Property
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="verified"
                        checked={formData.verified}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Verified Property
                    </label>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Images</h3>
                
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Current Images
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative">
                          <div className="relative group">
                            <img 
                              src={image} 
                              alt={`Property ${index}`} 
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                              <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-600 truncate mt-1">Image {index + 1}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New Images */}
                <div>
                  <label className="block w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <span className="text-lg text-gray-600">
                        Click to upload new property images (JPG, PNG)
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        You can select multiple images at once
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {images.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        New Images to Upload ({images.length})
                      </h4> 
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {images.map((image, index) => (
                          <div key={index} className="relative">
                            <div className="relative group">
                              <img 
                                src={URL.createObjectURL(image)} 
                                alt={`Preview ${index}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 truncate mt-1">{image.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel 
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                console.log('[EditPropertyModal] Update button clicked!');
                console.log('[EditPropertyModal] Loading state:', loading);
                console.log('[EditPropertyModal] Property ID:', property?.id);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />}
              {loading ? 'Updating...' : 'Update Property'} 
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;