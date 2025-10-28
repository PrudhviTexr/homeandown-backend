import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Shield, CheckCircle, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
// Using Python API for uploads and profile creation.
import { toast } from 'react-hot-toast';
import { isFileTypeAllowed, validateFileSize } from '@/utils/imageUpload';
import { uploadToServer } from '@/utils/uploader';
import LocationSelectorManual from '@/components/LocationSelectorManual';


const Sell: React.FC = () => {

  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    experience_years: '',
    license_number: '',
    pan_number: '',
    gst_number: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bank_account: '',
    ifsc_code: '',
    documents: {
      pan_card: null as File | null,
      business_license: null as File | null,
      address_proof: null as File | null,
      bank_statement: null as File | null,
      gst_certificate: null as File | null,
    }
  });
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file type is allowed (PNG, JPG, JPEG, PDF)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('File type not allowed. Please upload PNG, JPG, JPEG, or PDF files only.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [fieldName]: file
        }
      }));
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      // Validate and upload documents via Python API
      const documentUrls: Record<string, string> = {};

      console.log('Uploading seller documents for user:', user.id);

      // Upload each document and get public URL
      for (const [key, file] of Object.entries(formData.documents)
        .filter(([_, file]) => file !== null)
      ) {
        try {
          console.log(`Uploading ${key} document...`);
          const f = file as File;
          if (!isFileTypeAllowed(f)) {
            toast.error(`${key} has unsupported file type`);
            continue;
          }
          if (!validateFileSize(f)) {
            toast.error(`${key} is too large`);
            continue;
          }
          const resp = await uploadToServer(f, 'seller_doc', Number(user.id) || 0);
          if (resp?.url) {
            documentUrls[key] = resp.url;
          }
        } catch (error) {
          console.error(`Error uploading ${key}:`, error);
        }
      }

      console.log('All documents uploaded:', documentUrls);

      // Create seller profile via Python API
      const sellerProfileData = {
        user_id: user.id,
        business_name: formData.business_name,
        business_type: formData.business_type,
        experience_years: parseInt(formData.experience_years) || 0,
        license_number: formData.license_number,
        pan_number: formData.pan_number,
        gst_number: formData.gst_number,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        bank_account: formData.bank_account,
        ifsc_code: formData.ifsc_code,
        documents: documentUrls,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const sellerResponse = await fetch('/api/users/seller-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sellerProfileData)
      });

      if (!sellerResponse.ok) {
        throw new Error('Failed to create seller profile');
      }

      // Update user type to 'seller'
      const userUpdateResponse = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_type: 'seller' })
      });

      if (!userUpdateResponse.ok) {
        throw new Error('Failed to update user type');
      }

      setStep(3); // Success step
      toast.success('Seller application submitted successfully!');
    } catch (error) {
      console.error('Error submitting seller application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (

    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#061D58] mb-4">Start Selling Properties</h1>
        <p className="text-gray-600 text-lg">Join thousands of property sellers on our platform</p>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <Upload className="w-16 h-16 text-[#0ca5e9] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Easy Listing</h3>
          <p className="text-gray-600">Upload your property details and photos in minutes</p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <Shield className="w-16 h-16 text-[#0ca5e9] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Verified Platform</h3>
          <p className="text-gray-600">All sellers are verified for buyer confidence</p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <CheckCircle className="w-16 h-16 text-[#0ca5e9] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Quick Sales</h3>
          <p className="text-gray-600">Connect with serious buyers faster</p>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => user ? setStep(2) : setShowAuthModal(true)}
          className="bg-[#0ca5e9] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#068ac4] transition-colors"
        >
          {user ? 'Start Verification Process' : 'Sign Up to Start Selling'}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#061D58] mb-4">Seller Verification</h1>
        <p className="text-gray-600">Please provide the following information to verify your account</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
            <select
              name="business_type"
              value={formData.business_type}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
              required
            >
              <option value="">Select Business Type</option>
              <option value="individual">Individual</option>
              <option value="partnership">Partnership</option>
              <option value="company">Company</option>
              <option value="llp">LLP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years) *</label>
            <input
              type="number"
              name="experience_years"
              value={formData.experience_years}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
            <input
              type="text"
              name="license_number"
              value={formData.license_number}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number *</label>
            <input
              type="text"
              name="pan_number"
              value={formData.pan_number}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
            <input
              type="text"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
            />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Address Information</h3>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                placeholder="Enter complete address with landmarks"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City/Area</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                placeholder="Enter specific area/locality"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Banking Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number *</label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code *</label>
              <input
                type="text"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Document Upload</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'pan_card', label: 'PAN Card *', required: true },
              { key: 'business_license', label: 'Business License', required: false },
              { key: 'address_proof', label: 'Address Proof *', required: true },
              { key: 'bank_statement', label: 'Bank Statement *', required: true },
              { key: 'gst_certificate', label: 'GST Certificate', required: false },
            ].map(({ key, label, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <label className="block w-full">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#90C641] transition-colors">
                    {formData.documents[key as keyof typeof formData.documents] ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <span className="text-sm text-green-600 break-all">
                          {formData.documents[key as keyof typeof formData.documents]?.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-600">
                          Click to upload {required ? '(Required)' : '(Optional)'}<br />
                          PNG, JPG, JPEG, PDF only
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, key)}
                    className="hidden"
                    required={required}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors disabled:opacity-50 flex items-center"
          >
            {loading && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />}
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-2xl mx-auto text-center">
      <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-[#061D58] mb-4">Application Submitted!</h1>
      <p className="text-gray-600 text-lg mb-8">
        Your seller verification application has been submitted successfully.
        Our team will review your documents and get back to you within 2-3 business days.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">What's Next?</h3>
        <ul className="text-left text-blue-700 space-y-2">
          <li className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Document verification (1-2 days)
          </li>
          <li className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Background check (1-2 days)
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Account activation
          </li>
        </ul>
      </div>
      <button
        onClick={() => navigate('/')}
        className="bg-[#90C641] text-white px-8 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors"
      >
        Back to Home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-[90px] pb-16">
        <div style={{ paddingTop: '50px' }}>
          <div className="container mx-auto px-4">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />
    </div>
  );
};

export default Sell;