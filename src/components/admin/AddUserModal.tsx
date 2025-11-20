import React, { useState, useEffect } from 'react';
import { X, Upload, Eye, EyeOff } from 'lucide-react';
import toast from '../../components/ui/toast';
import { isFileTypeAllowed, uploadImage } from '@/utils/imageUpload';
import { pyFetch } from '@/utils/backend';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
   city: '',
   state: '',
    user_type: 'buyer',
    status: 'active',
    verification_status: 'pending',
    date_of_birth: '',
    // Agent specific fields
    agency_name: '',
    license_number: '',
    experience_years: '',
    specialization: '',
    // Documents
    profile_image: null as File | null,
    id_document: null as File | null,
    address_document: null as File | null,
  });

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

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
      // Check if file type is allowed
      // const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!isFileTypeAllowed(file)) {
        toast.error('File type not allowed. Please upload PNG, JPG, JPEG, or PDF files only.');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we're in cooldown period
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown} seconds before adding another user.`);
      console.log(`In cooldown period: ${cooldown} seconds remaining`);
      return;
    }
    
    setLoading(true);
  console.log('Creating user with data:', { ...formData, password: '[REDACTED]' });

  // const timestamp = new Date().toISOString();

    try {
      // Set cooldown at the beginning to prevent multiple submissions
      // Validate password is provided
      if (!formData.password) {
        toast.error('Password is required for new users');
        return;
      }

      // Create user via Python API
      const created = await pyFetch('/api/admin/users', {
        method: 'POST',
        useApiKey: true,
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          city: formData.city || '',
          state: formData.state || '',
          user_type: formData.user_type,
          status: formData.status || 'active',
          verification_status: formData.verification_status,
          date_of_birth: formData.date_of_birth || null,
          agent_license_number: formData.license_number || null,
        })
      });
      const user = Array.isArray(created) ? created[0] : created;

      // Handle document uploads if provided
      if (formData.profile_image) {
        await uploadImage(formData.profile_image, 'user', Number(user.id));
      }
      if (formData.id_document) {
        await uploadImage(formData.id_document, 'user', Number(user.id));
      }
      if (formData.address_document) {
        await uploadImage(formData.address_document, 'user', Number(user.id));
      }

      toast.success('User created successfully!');
      onUserAdded();
      onClose();
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone_number: '',
       city: '',
       state: '',
        user_type: 'buyer',
        status: 'active',
        verification_status: 'pending',
        date_of_birth: '',
        agency_name: '',
        license_number: '',
        experience_years: '',
        specialization: '',
        profile_image: null,
        id_document: null,
        address_document: null,
      });

    } catch (error: any) {
      console.error('Error creating user in AddUserModal:', error);
     
      // Extract error message
      let errorMessage = '';
      if (error instanceof Error) { 
        errorMessage = error.message || 'Unknown error';
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = String(error);
        }
      } else {
        errorMessage = 'Unknown error occurred';
      }
      
      // Check for rate limit error - first format
      if (errorMessage.includes('over_email_send_rate_limit')) {
        // Try to extract wait time from error message (e.g., "after 38 seconds")
        let waitTime = 48; // Default
        const match = errorMessage.match(/after (\d+) seconds/);
        if (match && match[1]) {
          waitTime = parseInt(match[1]);
        }
        
        // Update cooldown timer if needed
        if (waitTime > cooldown) {
          setCooldown(waitTime);
        }
        
        toast.error(`Rate limit reached. Please wait ${waitTime} seconds before creating another user.`);
      } else {
        toast.error(`Failed to create user: ${errorMessage.substring(0, 100)}...`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {cooldown > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">Rate limit active. Please wait {cooldown} seconds before creating another user.</p>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 City
               </label>
               <input
                 type="text"
                 name="city"
                 value={formData.city}
                 onChange={handleInputChange}
                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 State
               </label>
               <input
                 type="text"
                 name="state"
                 value={formData.state}
                 onChange={handleInputChange}
                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
               />
             </div>
            </div>

            {/* User Type and Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">User Type & Status</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Type *
                </label>
                <select
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status *
                </label>
                <select
                  name="verification_status"
                  value={formData.verification_status}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Agent specific fields */}
              {formData.user_type === 'agent' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agency Name
                    </label>
                    <input
                      type="text"
                      name="agency_name"
                      value={formData.agency_name}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="experience_years"
                      value={formData.experience_years}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Specialization</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="luxury">Luxury Properties</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Upload</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <label className="block w-full">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      {formData.profile_image?.name || 'Upload profile photo (PNG, JPG, JPEG)'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'profile_image')}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Document
                </label>
                <label className="block w-full">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      {formData.id_document?.name || 'Upload ID document (PNG, JPG, JPEG, PDF)'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'id_document')}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Document
                </label>
                <label className="block w-full">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      {formData.address_document?.name || 'Upload address proof (PNG, JPG, JPEG, PDF)'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'address_document')}
                    className="hidden"
                  />
                </label>
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
              disabled={loading || cooldown > 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />}
              {loading ? 'Creating...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;