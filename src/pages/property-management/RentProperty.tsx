import React, { useState } from 'react';
import { DollarSign, Camera, MapPin, Calendar, Users, Star } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { toast } from 'react-hot-toast';
import LocationSelectorManual from '../../components/LocationSelectorManual';

const RentProperty: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    property_id: '',
    listing_type: 'RENT',
    monthly_rent: '',
    security_deposit: '',
    available_from: '',
    lease_duration: '',
    tenant_preferences: {
      family: false,
      bachelors: false,
      working_professionals: false,
      students: false
    },
    house_rules: {
      no_smoking: false,
      no_pets: false,
      no_parties: false,
      vegetarian_only: false
    },
    rental_terms: '',
    contact_preferences: {
      phone_calls: true,
      whatsapp: true,
      email: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState({
    state: '',
    district: '',
    mandal: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (category: string, key: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev] as any,
        [key]: !(prev[category as keyof typeof prev] as any)[key]
      }
    }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setLocationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const propertyData = {
        ...formData,
        owner_id: localStorage.getItem('user_id'),
        added_by: localStorage.getItem('user_id'),
        listing_type: 'RENT',
        status: 'active',
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
        toast.success('Property listed for rent successfully!');
        // Reset form or redirect
        window.location.href = '/my-properties';
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to list property. Please try again.');
      }
    } catch (error) {
      console.error('Error listing property:', error);
      toast.error('Failed to list property. Please try again.');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Rent Out Your Property</h1>
            <p className="text-gray-600">List your property for rent and find quality tenants through our platform</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? 'bg-[#90C641] text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-12 h-0.5 ${step > stepNum ? 'bg-[#90C641]' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Property Selection */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-[#90C641]" />
                  Select Your Property
                </h2>
                
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">Choose which property you want to list for rent:</p>
                  
                  {/* Property Selection - This would be populated from user's properties */}
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-[#90C641] cursor-pointer transition-colors">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="property_id"
                          value="property_1"
                          className="text-[#90C641] focus:ring-[#90C641]"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">3BHK Apartment in Gachibowli</h3>
                          <p className="text-sm text-gray-600">Serilingampally, Hyderabad, Telangana • 1,200 sq ft</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-gray-900">₹25,000</span>
                          <p className="text-sm text-gray-600">Current valuation</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-[#90C641] cursor-pointer transition-colors">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="property_id"
                          value="property_2"
                          className="text-[#90C641] focus:ring-[#90C641]"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">2BHK Independent House</h3>
                          <p className="text-sm text-gray-600">Bangalore North, Bangalore, Karnataka • 800 sq ft</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-gray-900">₹18,000</span>
                          <p className="text-sm text-gray-600">Current valuation</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Don't see your property?</strong> Add a new property to your portfolio first, then come back to list it for rent.
                    </p>
                  </div>
                  
                  {/* Location Details for Selected Property */}
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-4">Property Location Details</h3>
                    <LocationSelectorManual
                      selectedState={locationData.state}
                      selectedDistrict={locationData.district}
                      selectedMandal={locationData.mandal}
                      onStateChange={(value) => handleLocationChange('state', value)}
                      onDistrictChange={(value) => handleLocationChange('district', value)}
                      onMandalChange={(value) => handleLocationChange('mandal', value)}
                      required={false}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-[#90C641] text-white px-6 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Rental Details */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Pricing */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-[#90C641]" />
                    Rental Pricing
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Monthly Rent (₹)*</label>
                      <input
                        type="number"
                        name="monthly_rent"
                        value={formData.monthly_rent}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                        placeholder="e.g., 25000"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Security Deposit (₹)*</label>
                      <input
                        type="number"
                        name="security_deposit"
                        value={formData.security_deposit}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                        placeholder="e.g., 50000"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[#90C641]" />
                    Availability
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Available From*</label>
                      <input
                        type="date"
                        name="available_from"
                        value={formData.available_from}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Preferred Lease Duration</label>
                      <select
                        name="lease_duration"
                        value={formData.lease_duration}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                      >
                        <option value="">Select Duration</option>
                        <option value="6_months">6 Months</option>
                        <option value="1_year">1 Year</option>
                        <option value="2_years">2 Years</option>
                        <option value="3_years">3 Years</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tenant Preferences */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-[#90C641]" />
                    Tenant Preferences
                  </h2>
                  
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-3">Who can rent this property? (Select all that apply)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries({
                        family: 'Families',
                        bachelors: 'Bachelors',
                        working_professionals: 'Working Professionals',
                        students: 'Students'
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.tenant_preferences[key as keyof typeof formData.tenant_preferences]}
                            onChange={() => handleCheckboxChange('tenant_preferences', key)}
                            className="text-[#90C641] focus:ring-[#90C641] rounded"
                          />
                          <span className="text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">House Rules</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries({
                        no_smoking: 'No Smoking',
                        no_pets: 'No Pets',
                        no_parties: 'No Parties',
                        vegetarian_only: 'Vegetarian Only'
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.house_rules[key as keyof typeof formData.house_rules]}
                            onChange={() => handleCheckboxChange('house_rules', key)}
                            className="text-[#90C641] focus:ring-[#90C641] rounded"
                          />
                          <span className="text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-[#90C641] text-white px-6 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Additional Details */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Additional Terms */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Additional Rental Terms & Conditions</label>
                    <textarea
                      name="rental_terms"
                      value={formData.rental_terms}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641]"
                      placeholder="Any additional terms, conditions, or special requirements..."
                    />
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Contact Preferences</h3>
                    <p className="text-sm text-gray-600 mb-3">How would you like potential tenants to contact you?</p>
                    <div className="space-y-2">
                      {Object.entries({
                        phone_calls: 'Phone Calls',
                        whatsapp: 'WhatsApp Messages',
                        email: 'Email'
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.contact_preferences[key as keyof typeof formData.contact_preferences]}
                            onChange={() => handleCheckboxChange('contact_preferences', key)}
                            className="text-[#90C641] focus:ring-[#90C641] rounded"
                          />
                          <span className="text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Photo Enhancement */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Camera className="w-5 h-5 mr-2 text-[#90C641]" />
                    Enhance Your Listing
                  </h2>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-500 mr-2" />
                      <span className="font-medium text-yellow-800">Pro Tip:</span>
                    </div>
                    <p className="text-yellow-700 mt-1">
                      Properties with high-quality photos get 3x more inquiries. Consider uploading bright, well-lit photos of all rooms.
                    </p>
                  </div>

                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Your property photos will be used from your existing property listing. 
                      You can add or update photos after publishing.
                    </p>
                    <button
                      type="button"
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Manage Photos
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#90C641] text-white px-6 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Publishing...
                      </>
                    ) : (
                      'Publish Rental Listing'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RentProperty;