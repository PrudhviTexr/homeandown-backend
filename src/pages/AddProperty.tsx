import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, DollarSign, Upload, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-hot-toast';
import LocationInput from '../components/LocationInput';
import LocationService from '../services/locationService';
import { uploadMultipleImages } from '../utils/imageUpload';
import { pyFetch } from '../utils/backend';

const AddProperty: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: '',
    listing_type: 'SALE',
    price: '',
    monthly_rent: '',
    security_deposit: '',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    address: '',
    city: '',
    state: '',
    district: '',
    mandal: '',
    zip_code: '',
    latitude: '',
    longitude: '',
    amenities: [] as string[],
    furnishing_status: '',
    available_from: '',
    images: [] as File[]
  });

  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [mandals, setMandals] = useState<string[]>([]);

  const propertyTypes = [
    'commercial', 'villa', 'independent_house', 'standalone_apartment', 
    'gated_apartment', 'land', 'farm_house', 'plot'
  ];

  const amenitiesList = [
    'Parking', 'Garden', 'Balcony', 'Swimming Pool', 'Gym', 'Security',
    'Lift', 'Power Backup', 'Water Supply', 'Internet', 'Air Conditioning'
  ];

  // Load location data
  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    if (formData.state) {
      loadDistricts(formData.state);
    } else {
      setDistricts([]);
      setMandals([]);
    }
  }, [formData.state]);

  useEffect(() => {
    if (formData.district) {
      loadMandals(formData.state, formData.district);
    } else {
      setMandals([]);
    }
  }, [formData.district]);

  const loadStates = async () => {
    try {
      const data = await LocationService.getStates();
      const stateNames = data.map((state: any) => state.name);
      setStates(stateNames);
    } catch (error) {
      console.error('Error loading states:', error);
      setStates([]);
    }
  };

  const loadDistricts = async (stateName: string) => {
    try {
      const data = await LocationService.getCitiesForState(stateName);
      const districtNames = data.map((city: any) => city.name);
      setDistricts(districtNames);
    } catch (error) {
      console.error('Error loading districts:', error);
      setDistricts([]);
    }
  };

  const loadMandals = async (stateName: string, districtName: string) => {
    try {
      const data = await LocationService.getCitiesForState(stateName);
      const mandalNames = data
        .filter((city: any) => city.name === districtName)
        .map((city: any) => city.name);
      setMandals(mandalNames);
    } catch (error) {
      console.error('Error loading mandals:', error);
      setMandals([]);
    }
  };

  const handleNewState = async (value: string) => {
    console.log('Adding new state:', value);
    setStates(prev => [...prev, value]);
  };

  const handleNewDistrict = async (value: string) => {
    console.log('Adding new district:', value);
    setDistricts(prev => [...prev, value]);
  };

  const handleNewMandal = async (value: string) => {
    console.log('Adding new mandal:', value);
    setMandals(prev => [...prev, value]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityChange = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        images: Array.from(e.target.files!)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to add a property');
      return;
    }

    setLoading(true);
    try {
      // Prepare property data with all required fields
      const propertyData: any = {
        // Basic Information
        title: formData.title || 'NA',
        description: formData.description || 'NA',
        property_type: formData.property_type || 'independent_house',
        listing_type: formData.listing_type || 'SALE',

        // Pricing
        price: formData.listing_type === 'SALE' && formData.price ? parseFloat(formData.price) : null,
        monthly_rent: formData.listing_type === 'RENT' && formData.monthly_rent ? parseFloat(formData.monthly_rent) : null,
        security_deposit: formData.listing_type === 'RENT' && formData.security_deposit ? parseFloat(formData.security_deposit) : null,

        // Location - REQUIRED FIELDS
        address: formData.address || 'NA',
        city: formData.city || 'NA',
        state: formData.state || 'NA',
        district: formData.district || 'NA',
        mandal: formData.mandal || 'NA',
        zip_code: formData.zip_code || 'NA',
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,

        // Basic Property Details
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        area_sqft: formData.area_sqft ? parseFloat(formData.area_sqft) : 0, // REQUIRED - must be > 0
        furnishing_status: formData.furnishing_status || 'NA',
        available_from: formData.available_from || null,

        // Amenities and Images
        amenities: formData.amenities || [],
        images: formData.images || [],

        // User info
        owner_id: user.id,
        added_by: user.id,
        added_by_role: user.user_type || 'seller',

        // Status fields
        status: 'active',
        featured: false,
        verified: false  // Properties require admin approval
      };

      // Ensure area_sqft is not 0 or empty
      if (!propertyData.area_sqft || propertyData.area_sqft <= 0) {
        toast.error('Property area is required and must be greater than 0');
        setLoading(false);
        return;
      }

      // Ensure required location fields are not empty
      if (propertyData.address === 'NA' || propertyData.city === 'NA' || propertyData.state === 'NA' || propertyData.zip_code === 'NA') {
        toast.error('Please fill in all required location fields');
        setLoading(false);
        return;
      }

      console.log('Sending property data:', propertyData);

      const result = await pyFetch('/api/properties', {
        method: 'POST',
        body: JSON.stringify(propertyData),
        useApiKey: false
      });

      console.log('Property created:', result);
      
      toast.success('Property submitted successfully! It will be reviewed by admin before being published.');
      
      // Upload images if any
      if (formData.images && formData.images.length > 0) {
        try {
          console.log(`Uploading ${formData.images.length} images...`);
          const imageUrls = await uploadMultipleImages(formData.images, 'property', result.id);
          console.log('Uploaded image URLs:', imageUrls);
          
          // Update property with image URLs
          await pyFetch(`/api/properties/${result.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ images: imageUrls }),
            useApiKey: false
          });
          
          console.log('Property updated with image URLs');
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          toast.error('Property created but some images failed to upload');
        }
      }
      
      toast.success('Property added successfully!');
      navigate('/my-properties');
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#90C641] rounded-full flex items-center justify-center mr-4">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
                <p className="text-gray-600">List your property on Home & Own</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  Basic Information
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                    placeholder="e.g., Beautiful 3BHK Apartment in Hyderabad"
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
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                    placeholder="Describe your property..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                  >
                    <option value="">Select Property Type</option>
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                  >
                    <option value="SALE">For Sale</option>
                    <option value="RENT">For Rent</option>
                  </select>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location Details
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <LocationInput
                    label="State"
                    value={formData.state}
                    onChange={(value) => setFormData(prev => ({ ...prev, state: value, district: '', mandal: '' }))}
                    placeholder="Enter state name"
                    required={true}
                    suggestions={states}
                    onNewEntry={handleNewState}
                  />
                  <LocationInput
                    label="District"
                    value={formData.district}
                    onChange={(value) => setFormData(prev => ({ ...prev, district: value, mandal: '' }))}
                    placeholder="Enter district name"
                    required={true}
                    suggestions={districts}
                    onNewEntry={handleNewDistrict}
                  />
                  <LocationInput
                    label="Mandal"
                    value={formData.mandal}
                    onChange={(value) => setFormData(prev => ({ ...prev, mandal: value }))}
                    placeholder="Enter mandal name"
                    required={true}
                    suggestions={mandals}
                    onNewEntry={handleNewMandal}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pricing
                </h2>
                
                {formData.listing_type === 'SALE' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                      placeholder="e.g., 5000000"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Rent (₹) *
                      </label>
                      <input
                        type="number"
                        name="monthly_rent"
                        value={formData.monthly_rent}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        placeholder="e.g., 25000"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        placeholder="e.g., 50000"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Property Details */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area (sq ft) *
                  </label>
                  <input
                    type="number"
                    name="area_sqft"
                    value={formData.area_sqft}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                    placeholder="e.g., 1200"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                  >
                    <option value="">Select Status</option>
                    <option value="furnished">Furnished</option>
                    <option value="semi_furnished">Semi-Furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>
                <div className="grid grid-cols-2 gap-2">
                  {amenitiesList.map(amenity => (
                    <label key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityChange(amenity)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Property Images
                </h2>
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload multiple images of your property
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#90C641] text-white px-8 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Property...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Add Property
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AddProperty;
