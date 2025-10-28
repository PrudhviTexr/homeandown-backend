import React, { useState, useEffect, useReducer } from 'react';
import { X, Upload, Plus, Trash2, Home, Building, Building2, Trees, Warehouse, MapPin, Eye, EyeOff } from 'lucide-react';
import { pyFetch } from '@/utils/backend';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMultipleImages, validateFileSize, isFileTypeAllowed } from '@/utils/imageUpload';
import toast from 'react-hot-toast';
import LocationSelector from '@/components/LocationSelector';
import ImageUpload from '@/components/ImageUpload';
import EnhancedImageUpload from '@/components/EnhancedImageUpload';

// Types
interface PropertyFormData {
  // Basic Information
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  custom_id: string;

  // Pricing
  price: string;
  monthly_rent: string;
  security_deposit: string;
  maintenance_charges: string;
  rate_per_sqft: string;
  rate_per_sqyd: string;

  // Location
  address: string;
  state_id: string;
  district_id: string;
  mandal_id: string;
  zip_code: string;
  latitude: string;
  longitude: string;

  // Basic Property Details
  bedrooms: string;
  bathrooms: string;
  balconies: string;
  area_sqft: string;
  area_sqyd: string;
  area_acres: string;
  carpet_area_sqft: string;
  built_up_area_sqft: string;
  plot_area_sqft: string;
  plot_area_sqyd: string;

  // Commercial Specific
  commercial_subtype: string;
  total_floors: string;
  floor: string;
  parking_spaces: string;
  lift_available: boolean;
  power_backup: boolean;
  washrooms: string;

  // Villa/House Specific
  bhk_config: string;
  floor_count: string;
  facing: string;
  private_garden: boolean;
  private_driveway: boolean;
  plot_dimensions: string;

  // Land/Farm Specific
  land_type: string;
  soil_type: string;
  road_access: boolean;
  boundary_fencing: boolean;
  water_availability: boolean;
  electricity_availability: boolean;
  corner_plot: boolean;
  water_source: string;

  // Apartment Specific
  apartment_type: string;

  // Community Features
  community_type: string;
  gated_community_features: string[];
  visitor_parking: boolean;

  // Legal & Status
  furnishing_status: string;
  legal_status: string;
  rera_status: string;
  rera_number: string;
  nearby_business_hubs: string;
  nearby_transport: string;

  // Ownership
  owner_id: string;
  status: string;
  featured: boolean;
  available_from: string;
  possession_date: string;
}

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
}

interface PropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  property?: PropertyFormData | null; // For editing
  mode: 'add' | 'edit';
  userRole: 'seller' | 'agent' | 'admin';
  roleFeatures?: {
    canAssignOwner: boolean;
    canSetFeatured: boolean;
    canDelete: boolean;
    canViewAllProperties: boolean;
  };
}

// Form state reducer for centralized state management
type FormAction = 
  | { type: 'SET_FIELD'; field: keyof PropertyFormData; value: any }
  | { type: 'SET_MULTIPLE_FIELDS'; fields: Partial<PropertyFormData> }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_PROPERTY_DATA'; data: PropertyFormData };

const initialFormData: PropertyFormData = {
  title: '',
  description: '',
  property_type: '',
  listing_type: 'SALE',
  custom_id: '',
  price: '',
  monthly_rent: '',
  security_deposit: '',
  maintenance_charges: '',
  rate_per_sqft: '',
  rate_per_sqyd: '',
  address: '',
  state_id: '',
  district_id: '',
  mandal_id: '',
  zip_code: '',
  latitude: '',
  longitude: '',
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
  lift_available: false,
  power_backup: false,
  washrooms: '',
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
  owner_id: '',
  status: 'active',
  featured: false,
  available_from: '',
  possession_date: '',
};

function formReducer(state: PropertyFormData, action: FormAction): PropertyFormData {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_MULTIPLE_FIELDS':
      return { ...state, ...action.fields };
    case 'RESET_FORM':
      return initialFormData;
    case 'LOAD_PROPERTY_DATA':
      return { ...state, ...action.data };
    default:
      return state;
  }
}

const UnifiedPropertyForm: React.FC<PropertyFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  property,
  mode,
  userRole,
  roleFeatures = {
    canAssignOwner: false,
    canSetFeatured: false,
    canDelete: false,
    canViewAllProperties: false
  }
}) => {
  const { user } = useAuth();
  const [formData, dispatch] = useReducer(formReducer, initialFormData);
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>(['']);
  const [users, setUsers] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'type' | 'details'>('type');

  // Property types configuration
  const PROPERTY_TYPES = [
    { value: 'independent_house', label: 'Independent House', icon: Home, category: 'Residential' },
    { value: 'standalone_apartment', label: 'Standalone Apartment', icon: Building, category: 'Residential' },
    { value: 'gated_apartment', label: 'Gated Apartment', icon: Building2, category: 'Residential' },
    { value: 'villa', label: 'Villa', icon: Home, category: 'Residential' },
    { value: 'commercial', label: 'Commercial', icon: Warehouse, category: 'Commercial' },
    { value: 'land', label: 'Land', icon: Trees, category: 'Land' },
    { value: 'farm_house', label: 'Farm House', icon: Trees, category: 'Land' },
    { value: 'plot', label: 'Plot', icon: MapPin, category: 'Land' }
  ];

  // Load property data for editing
  useEffect(() => {
    if (mode === 'edit' && property) {
      dispatch({ type: 'LOAD_PROPERTY_DATA', data: property });
      if (property.images && Array.isArray(property.images)) {
        setExistingImages(property.images);
      }
    }
  }, [mode, property]);

  // Load users for owner selection (admin/agent only)
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'agent') {
      loadUsers();
    }
  }, [userRole]);

  const loadUsers = async () => {
    try {
      const response = await pyFetch('/api/admin/users', { useApiKey: true });
      setUsers(response || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Load users for owner selection (admin/agent only)
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'agent') {
      loadUsers();
    }
  }, [userRole]);

  // Form field handlers
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      dispatch({ type: 'SET_FIELD', field: name as keyof PropertyFormData, value: checked });
    } else {
      dispatch({ type: 'SET_FIELD', field: name as keyof PropertyFormData, value: value });
      
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
      console.log('[UnifiedPropertyForm] Fetching location data for pincode:', pincode);
      
      // Call the pincode API endpoint using pyFetch
      const response = await pyFetch(`/api/properties/pincode/${pincode}/suggestions`, { useApiKey: true });
      
      if (response && response.suggestions) {
        const suggestions = response.suggestions;
        console.log('[UnifiedPropertyForm] Pincode data received:', suggestions);
        
        // Auto-populate form fields with suggested values
        dispatch({ 
          type: 'SET_MULTIPLE_FIELDS', 
          fields: {
            address: suggestions.address || formData.address,
            latitude: suggestions.latitude?.toString() || formData.latitude,
            longitude: suggestions.longitude?.toString() || formData.longitude,
            state_id: suggestions.state || formData.state_id,
            district_id: suggestions.district || formData.district_id,
            mandal_id: suggestions.mandal || formData.mandal_id
          }
        });
        
        console.log('[UnifiedPropertyForm] Form fields auto-populated successfully');
      }
    } catch (error) {
      console.error('[UnifiedPropertyForm] Error fetching pincode data:', error);
    }
  };

  const handleLocationChange = (field: 'state_id' | 'district_id' | 'mandal_id', value: string) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  // API integration methods
  const fetchPropertyData = async (propertyId: string) => {
    try {
      const response = await pyFetch(`/api/properties/${propertyId}`, { useApiKey: true });
      return response;
    } catch (error) {
      console.error('Error fetching property data:', error);
      throw error;
    }
  };

  const saveProperty = async (data: PropertyFormData) => {
    try {
      // Upload images first
      let imageUrls: string[] = [...existingImages];
      
      if (imagePreviews.length > 0) {
        const uploadedUrls = await uploadMultipleImages(
          imagePreviews.map(p => p.file),
          'property',
          0
        );
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      // Prepare data for API
      const apiData = {
        ...data,
        images: imageUrls,
        amenities: amenities.filter(a => a.trim() !== ''),
        added_by: user?.id,
        added_by_role: userRole
      };
      
      // Validate UUID fields before sending
      const uuidFields = ['owner_id', 'added_by'];
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      for (const field of uuidFields) {
        if (apiData[field] && typeof apiData[field] === 'string') {
          if (apiData[field] === '' || apiData[field] === 'null' || apiData[field] === 'undefined') {
            apiData[field] = null;
          } else if (!uuidPattern.test(apiData[field])) {
            toast.error(`Invalid ${field.replace('_', ' ')} format. Please check the selected value.`);
            throw new Error(`Invalid UUID for ${field}`);
          }
        }
      }

      if (mode === 'add') {
        await pyFetch('/api/properties', {
          method: 'POST',
          useApiKey: true,
          body: JSON.stringify(apiData)
        });
        toast.success('Property added successfully!');
      } else if (mode === 'edit' && property) {
        await pyFetch(`/api/properties/${property.id}`, {
          method: 'PUT',
          useApiKey: true,
          body: JSON.stringify(apiData)
        });
        toast.success('Property updated successfully!');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Failed to save property. Please try again.');
    }
  };

  const deleteProperty = async (propertyId: string) => {
    try {
      await pyFetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        useApiKey: true
      });
      toast.success('Property deleted successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await saveProperty(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (mode === 'edit' && property && window.confirm('Are you sure you want to delete this property?')) {
      setLoading(true);
      try {
        await deleteProperty(property.id);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'add' ? 'Add New Property' : 'Edit Property'}
            </h2>
            <div className="flex gap-2">
              {mode === 'edit' && roleFeatures.canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  Delete
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Property Type Selection */}
          {currentStep === 'type' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Property Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PROPERTY_TYPES.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'SET_FIELD', field: 'property_type', value: type.value });
                        setCurrentStep('details');
                      }}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        formData.property_type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <div className="text-sm font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.category}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Property Details Form */}
          {currentStep === 'details' && (
            <div className="space-y-8">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => setCurrentStep('type')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Property Type
              </button>

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder={`Enter ${formData.property_type.replace('_', ' ')} title`}
                      required
                    />
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
                    >
                      <option value="SALE">For Sale</option>
                      <option value="RENT">For Rent</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`Describe this ${formData.property_type.replace('_', ' ')}`}
                    required
                  />
                </div>
              </div>

              {/* Location Details */}
              <LocationSelector
                key={`location-${formData.property_type}-${formData.zip_code || 'empty'}`}
                formData={formData}
                setFormData={(fn) => {
                  if (typeof fn === 'function') {
                    dispatch({ type: 'SET_MULTIPLE_FIELDS', fields: fn(formData) });
                  } else {
                    dispatch({ type: 'SET_MULTIPLE_FIELDS', fields: fn });
                  }
                }}
                handleInputChange={handleInputChange}
                required
              />

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rent (₹)
                    </label>
                    <input
                      type="number"
                      name="monthly_rent"
                      value={formData.monthly_rent}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter monthly rent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      name="security_deposit"
                      value={formData.security_deposit}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter security deposit"
                    />
                  </div>
                </div>
              </div>

              {/* Property Type Specific Fields */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                
                {/* Commercial Property Fields */}
                {formData.property_type === 'commercial' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Commercial Subtype *
                      </label>
                      <select
                        name="commercial_subtype"
                        value={formData.commercial_subtype}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Subtype</option>
                        <option value="office">Office</option>
                        <option value="retail">Retail</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="industrial">Industrial</option>
                        <option value="shop">Shop</option>
                        <option value="showroom">Showroom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Floors
                      </label>
                      <input
                        type="number"
                        name="total_floors"
                        value={formData.total_floors}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter total floors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Floor Number
                      </label>
                      <input
                        type="number"
                        name="floor"
                        value={formData.floor}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter floor number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parking Spaces
                      </label>
                      <input
                        type="text"
                        name="parking_spaces"
                        value={formData.parking_spaces}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter parking spaces"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="lift_available"
                        checked={formData.lift_available}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Lift Available</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="power_backup"
                        checked={formData.power_backup}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Power Backup</label>
                    </div>
                  </div>
                )}

                {/* Villa/House Property Fields */}
                {(formData.property_type === 'villa' || formData.property_type === 'independent_house') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        BHK Configuration *
                      </label>
                      <select
                        name="bhk_config"
                        value={formData.bhk_config}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select BHK</option>
                        <option value="1BHK">1 BHK</option>
                        <option value="2BHK">2 BHK</option>
                        <option value="3BHK">3 BHK</option>
                        <option value="4BHK">4 BHK</option>
                        <option value="5BHK">5 BHK</option>
                        <option value="6BHK+">6+ BHK</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Floor Count
                      </label>
                      <input
                        type="number"
                        name="floor_count"
                        value={formData.floor_count}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter floor count"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facing Direction
                      </label>
                      <select
                        name="facing"
                        value={formData.facing}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Facing</option>
                        <option value="north">North</option>
                        <option value="south">South</option>
                        <option value="east">East</option>
                        <option value="west">West</option>
                        <option value="northeast">Northeast</option>
                        <option value="northwest">Northwest</option>
                        <option value="southeast">Southeast</option>
                        <option value="southwest">Southwest</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plot Dimensions
                      </label>
                      <input
                        type="text"
                        name="plot_dimensions"
                        value={formData.plot_dimensions}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 40x60 ft"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="private_garden"
                        checked={formData.private_garden}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Private Garden</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="private_driveway"
                        checked={formData.private_driveway}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Private Driveway</label>
                    </div>
                  </div>
                )}

                {/* Land/Farm Property Fields */}
                {(formData.property_type === 'land' || formData.property_type === 'farm_house') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Land Type *
                      </label>
                      <select
                        name="land_type"
                        value={formData.land_type}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Land Type</option>
                        <option value="residential">Residential</option>
                        <option value="agricultural">Agricultural</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Soil Type
                      </label>
                      <input
                        type="text"
                        name="soil_type"
                        value={formData.soil_type}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter soil type"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Water Source
                      </label>
                      <input
                        type="text"
                        name="water_source"
                        value={formData.water_source}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Borewell, Municipal"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="road_access"
                        checked={formData.road_access}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Road Access</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="boundary_fencing"
                        checked={formData.boundary_fencing}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Boundary Fencing</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="water_availability"
                        checked={formData.water_availability}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Water Availability</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="electricity_availability"
                        checked={formData.electricity_availability}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Electricity Availability</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="corner_plot"
                        checked={formData.corner_plot}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Corner Plot</label>
                    </div>
                  </div>
                )}

                {/* Apartment Property Fields */}
                {(formData.property_type === 'standalone_apartment' || formData.property_type === 'gated_apartment') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apartment Type
                      </label>
                      <select
                        name="apartment_type"
                        value={formData.apartment_type}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Apartment Type</option>
                        <option value="studio">Studio</option>
                        <option value="1bhk">1 BHK</option>
                        <option value="2bhk">2 BHK</option>
                        <option value="3bhk">3 BHK</option>
                        <option value="4bhk">4 BHK</option>
                        <option value="penthouse">Penthouse</option>
                        <option value="duplex">Duplex</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Community Type
                      </label>
                      <select
                        name="community_type"
                        value={formData.community_type}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Community Type</option>
                        <option value="standalone">Standalone</option>
                        <option value="gated">Gated Community</option>
                        <option value="apartment_complex">Apartment Complex</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="visitor_parking"
                        checked={formData.visitor_parking}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Visitor Parking</label>
                    </div>
                  </div>
                )}

                {/* Common Property Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                      placeholder="Enter number of bedrooms"
                    />
                  </div>
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
                      placeholder="Enter number of bathrooms"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area (Sq Ft) *
                    </label>
                    <input
                      type="number"
                      name="area_sqft"
                      value={formData.area_sqft}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter area in square feet"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area (Sq Yards)
                    </label>
                    <input
                      type="number"
                      name="area_sqyd"
                      value={formData.area_sqyd}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter area in square yards"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area (Acres)
                    </label>
                    <input
                      type="number"
                      name="area_acres"
                      value={formData.area_acres}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter area in acres"
                    />
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
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Fully-Furnished">Fully-Furnished</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Images */}
              <EnhancedImageUpload
                existingImages={existingImages}
                onImagesChange={setExistingImages}
                onUploadComplete={(urls) => {
                  console.log('Images uploaded successfully:', urls);
                  toast.success(`Successfully uploaded ${urls.length} images to Supabase Storage!`);
                }}
                maxImages={10}
                bucket="property-images"
                folder="properties"
              />

              {/* Role-specific features */}
              {roleFeatures.canAssignOwner && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Assignment</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Owner
                    </label>
                    <select
                      name="owner_id"
                      value={formData.owner_id}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Owner</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.user_type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Admin-specific features */}
              {userRole === 'admin' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Featured Property</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : mode === 'add' ? 'Add Property' : 'Update Property'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UnifiedPropertyForm;
