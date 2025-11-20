import React, { useState } from 'react';
import { Plus, Home, MapPin, DollarSign, FileText, Upload } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { toast } from 'react-hot-toast';
import LocationSelectorManual from '../../components/LocationSelectorManual';
import { uploadMultipleImages } from '../../utils/imageUpload';

const AddNRIProperty: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: '',
    price: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    listing_type: 'RENT',
    monthly_rent: '',
    security_deposit: '',
    available_from: '',
    furnishing_status: '',
    amenities: [] as string[],
    management_type: 'FULL_SERVICE',
    images: [] as File[]
  });

  const [locationData, setLocationData] = useState({
    state: '',
    district: '',
    mandal: ''
  });

  const [loading, setLoading] = useState(false);

  const propertyTypes = [
    'Apartment',
    'Independent House',
    'Villa',
    'Penthouse',
    'Studio',
    'Duplex',
    'Triplex',
    'Plot/Land'
  ];

  const furnishingOptions = [
    'Fully Furnished',
    'Semi Furnished',
    'Unfurnished'
  ];

  const managementTypes = [
    { value: 'FULL_SERVICE', label: 'Full Service Management', description: 'Complete property management including tenant screening, rent collection, maintenance' },
    { value: 'RENTAL_ONLY', label: 'Rental Management Only', description: 'Focus on finding tenants and rent collection' },
    { value: 'MAINTENANCE_ONLY', label: 'Maintenance Only', description: 'Property maintenance and emergency repairs' },
    { value: 'CONSULTATION', label: 'Consultation Services', description: 'Advisory services and market guidance' }
  ];

  const availableAmenities = [
    'Parking',
    'Swimming Pool',
    'Gym',
    'Security',
    'Elevator',
    'Power Backup',
    'Garden',
    'Club House',
    'Children Play Area',
    'Internet/WiFi'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleLocationChange = (field: string, value: string) => {
    setLocationData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update form data with location info
    if (field === 'state') {
      setFormData(prev => ({ ...prev, state: value }));
    }
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
    setLoading(true);

    try {
      const propertyData = {
        ...formData,
        ...locationData,
        owner_id: localStorage.getItem('user_id'),
        added_by: localStorage.getItem('user_id'),
        listing_type: 'RENT',
        status: 'pending',
        verified: false,
        featured: false
      };

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Property created:', result);
        
        // Upload images if any
        if (formData.images && formData.images.length > 0) {
          try {
            console.log(`Uploading ${formData.images.length} images...`);
            const imageUrls = await uploadMultipleImages(formData.images, 'property', result.id);
            console.log('Uploaded image URLs:', imageUrls);
            
            // Update property with image URLs
            const updateResponse = await fetch(`/api/properties/${result.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              },
              body: JSON.stringify({ images: imageUrls })
            });
            
            if (updateResponse.ok) {
              console.log('Property updated with image URLs');
            } else {
              console.error('Failed to update property with images');
            }
          } catch (uploadError) {
            console.error('Error uploading images:', uploadError);
            toast.error('Property created but some images failed to upload');
          }
        }
        
        toast.success('Property added successfully! Our team will contact you within 24 hours.');
        // Reset form
        setFormData({
          title: '',
          description: '',
          property_type: '',
          price: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          bedrooms: '',
          bathrooms: '',
          area_sqft: '',
          listing_type: 'RENT',
          monthly_rent: '',
          security_deposit: '',
          available_from: '',
          furnishing_status: '',
          amenities: [],
          management_type: 'FULL_SERVICE',
          images: []
        });
        setLocationData({
          state: '',
          district: '',
          mandal: ''
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to add property. Please try again.');
      }
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Failed to add property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Property for NRI Management</h1>
            <p className="text-gray-600">Let us manage your property while you're away. Our comprehensive management services ensure your investment is in safe hands.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Property Type Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Home className="w-5 h-5 mr-2 text-[#90C641]" />
                Property Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Property Title*</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    placeholder="e.g., Beautiful 3BHK Apartment in Gachibowli"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Property Type*</label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    required
                  >
                    <option value="">Select Property Type</option>
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                  placeholder="Describe your property, its features, and surroundings..."
                />
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#90C641]" />
                Location Details
              </h2>
              
              {/* Location Selector */}
              <div className="mb-6">
                <LocationSelectorManual
                  selectedState={locationData.state}
                  selectedDistrict={locationData.district}
                  selectedMandal={locationData.mandal}
                  onStateChange={(value) => handleLocationChange('state', value)}
                  onDistrictChange={(value) => handleLocationChange('district', value)}
                  onMandalChange={(value) => handleLocationChange('mandal', value)}
                  required={true}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Address*</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    placeholder="Full address of the property"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">City*</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    placeholder="Enter specific area/locality"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[#90C641]" />
                Property Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Bedrooms</label>
                  <select
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                  >
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} BHK</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Bathrooms</label>
                  <select
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                  >
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Area (sq ft)</label>
                  <input
                    type="number"
                    name="area_sqft"
                    value={formData.area_sqft}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    placeholder="e.g., 1200"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-700 font-medium mb-2">Furnishing Status</label>
                <select
                  name="furnishing_status"
                  value={formData.furnishing_status}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                >
                  <option value="">Select Furnishing Status</option>
                  {furnishingOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rental Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[#90C641]" />
                Rental Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Expected Monthly Rent (₹)</label>
                  <input
                    type="number"
                    name="monthly_rent"
                    value={formData.monthly_rent}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    placeholder="e.g., 25000"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Security Deposit (₹)</label>
                  <input
                    type="number"
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                    placeholder="e.g., 50000"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Available From</label>
                  <input
                    type="date"
                    name="available_from"
                    value={formData.available_from}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                  />
                </div>
              </div>
            </div>

            {/* Management Type */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Management Service Type</h2>
              
              <div className="space-y-4">
                {managementTypes.map(type => (
                  <div key={type.value} className="border border-gray-200 rounded-lg p-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="management_type"
                        value={type.value}
                        checked={formData.management_type === type.value}
                        onChange={handleInputChange}
                        className="mt-1 text-[#90C641] focus:ring-[#90C641]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableAmenities.map(amenity => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityChange(amenity)}
                      className="text-[#90C641] focus:ring-[#90C641] rounded"
                    />
                    <span className="text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Photo Upload */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-[#90C641]" />
                Property Photos
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Upload Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload multiple images of your property (PNG, JPG, JPEG)
                  </p>
                </div>
                {formData.images.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Selected {formData.images.length} image(s)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.images.map((file, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#90C641] text-white px-8 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors disabled:opacity-50 flex items-center justify-center mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add Property for NRI Management
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600 mt-3">
                  Our team will contact you within 24 hours to discuss the management plan and next steps.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AddNRIProperty;