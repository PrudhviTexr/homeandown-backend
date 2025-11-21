import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Award, Edit, Save, X,
  Upload, Camera, FileText, CheckCircle, AlertCircle, Clock,
  Building, CreditCard, Shield, Settings
} from 'lucide-react';
import { getApiUrl } from '@/utils/backend';
import LocationSelector from '@/components/LocationSelector';

interface AgentProfileProps {
  user: any;
  onProfileUpdate?: (updatedProfile: any) => void;
}

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  city: string;
  state: string;
  district: string;
  mandal: string;
  zipCode: string;
  address: string;
  latitude: string;
  longitude: string;
  bio: string;
  profileImageUrl: string;
  licenseNumber: string;
  customId: string;
  status: string;
  verificationStatus: string;
  commissionRate: number;
  businessName: string;
  createdAt: string;
  updatedAt: string;
}

const AgentProfile: React.FC<AgentProfileProps> = ({ user, onProfileUpdate }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'documents' | 'settings'>('personal');
  
  // Form state
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      // Try to fetch detailed profile first
      try {
        const response = await fetch(getApiUrl(`/api/admin/agents/${user?.id}/profile`), { headers });
        if (response.ok) {
          const profileData = await response.json();
          setProfile(profileData.agent);
          setFormData(profileData.agent);
          return;
        }
      } catch (error) {
        console.log('Detailed profile endpoint not available, using user data');
      }

      // Fallback: Use user data
      if (user) {
        const profileData: ProfileData = {
          id: user.id,
          email: user.email || '',
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          phoneNumber: user.phone_number || '',
          city: user.city || '',
          state: user.state || '',
          district: user.district || '',
          mandal: user.mandal || '',
          zipCode: user.zip_code || '',
          address: user.address || '',
          latitude: user.latitude || '',
          longitude: user.longitude || '',
          bio: user.bio || '',
          profileImageUrl: user.profile_image_url || '',
          licenseNumber: user.license_number || user.agent_license_number || '',
          customId: user.custom_id || '',
          status: user.status || 'pending',
          verificationStatus: user.verification_status || 'pending',
          commissionRate: user.commission_rate || 0.02,
          businessName: user.business_name || '',
          createdAt: user.created_at || '',
          updatedAt: user.updated_at || ''
        };
        
        setProfile(profileData);
        setFormData(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state?.trim()) {
      newErrors.state = 'State is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      // Use the user profile endpoint instead of admin endpoint
      const { pyFetch } = await import('@/utils/backend');
      
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
        city: formData.city,
        state: formData.state,
        district: formData.district,
        mandal: formData.mandal,
        zip_code: formData.zipCode,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        bio: formData.bio,
        business_name: formData.businessName
      };

      console.log('[AGENT PROFILE] Updating profile with data:', updateData);
      
      const response = await pyFetch('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        useApiKey: false
      });

      console.log('[AGENT PROFILE] Profile updated successfully:', response);
      
      // Update local state
      setProfile(response);
      setEditing(false);
      
      if (onProfileUpdate) {
        onProfileUpdate(response);
      }
      
      // Show success message
      const toast = (await import('react-hot-toast')).default;
      toast.success('Profile updated successfully!');
      
    } catch (error: any) {
      console.error('[AGENT PROFILE] Error updating profile:', error);
      const toast = (await import('react-hot-toast')).default;
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
    setErrors({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'suspended': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {profile.profileImageUrl ? (
                <img
                  className="h-16 w-16 rounded-full object-cover"
                  src={profile.profileImageUrl}
                  alt="Profile"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-gray-600">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(profile.status)}`}>
                  {getStatusIcon(profile.status)}
                  {profile.status}
                </span>
                <span className="text-xs text-gray-500">
                  License: {profile.licenseNumber || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'personal', label: 'Personal Info', icon: User },
            { id: 'professional', label: 'Professional Info', icon: Award },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!editing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                } ${!editing ? 'bg-gray-50' : ''}`}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!editing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                } ${!editing ? 'bg-gray-50' : ''}`}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!editing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } ${!editing ? 'bg-gray-50' : ''}`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber || ''}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                disabled={!editing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                } ${!editing ? 'bg-gray-50' : ''}`}
              />
              {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
            </div>

            {editing ? (
              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>Location Information:</strong> Enter your zipcode (6 digits) to automatically fill all location details.
                  </p>
                  <LocationSelector
                    formData={{
                      zip_code: formData.zipCode || '',
                      city: formData.city || '',
                      state: formData.state || '',
                      district: formData.district || '',
                      mandal: formData.mandal || '',
                      address: formData.address || '',
                      latitude: formData.latitude || '',
                      longitude: formData.longitude || ''
                    }}
                    setFormData={(newData) => {
                      setFormData(prev => ({
                        ...prev,
                        zipCode: newData.zip_code,
                        city: newData.city,
                        state: newData.state,
                        district: newData.district,
                        mandal: newData.mandal,
                        address: newData.address,
                        latitude: newData.latitude,
                        longitude: newData.longitude
                      }));
                    }}
                    handleInputChange={(e) => {
                      const { name, value } = e.target;
                      const fieldMap: { [key: string]: string } = {
                        'zip_code': 'zipCode',
                        'city': 'city',
                        'state': 'state',
                        'district': 'district',
                        'mandal': 'mandal',
                        'address': 'address',
                        'latitude': 'latitude',
                        'longitude': 'longitude'
                      };
                      const mappedField = fieldMap[name] || name;
                      handleInputChange(mappedField, value);
                    }}
                    required={false}
                  />
                </div>
              </div>
            ) : (
              // Display mode - show all location fields
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zipcode</label>
                  <p className="text-gray-900">{formData.zipCode || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <p className="text-gray-900 flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-400" />
                    {formData.city || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <p className="text-gray-900">{formData.state || 'Not provided'}</p>
                </div>
                {formData.district && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                    <p className="text-gray-900">{formData.district}</p>
                  </div>
                )}
                {formData.mandal && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mandal</label>
                    <p className="text-gray-900">{formData.mandal}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <p className="text-gray-900">{formData.address || 'Not provided'}</p>
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!editing}
                rows={4}
                placeholder="Tell us about yourself..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !editing ? 'bg-gray-50' : ''
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Professional Info Tab */}
      {activeTab === 'professional' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
              <input
                type="text"
                value={profile.licenseNumber || 'N/A'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-500">License number is auto-generated</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom ID</label>
              <input
                type="text"
                value={profile.customId || 'N/A'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
              <input
                type="text"
                value={formData.businessName || ''}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                disabled={!editing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !editing ? 'bg-gray-50' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate</label>
              <input
                type="text"
                value={`${(profile.commissionRate * 100).toFixed(1)}%`}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-500">Commission rate is set by admin</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <input
                type="text"
                value={formData.district || ''}
                onChange={(e) => handleInputChange('district', e.target.value)}
                disabled={!editing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !editing ? 'bg-gray-50' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mandal</label>
              <input
                type="text"
                value={formData.mandal || ''}
                onChange={(e) => handleInputChange('mandal', e.target.value)}
                disabled={!editing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !editing ? 'bg-gray-50' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(profile.status)}`}>
                {getStatusIcon(profile.status)}
                {profile.status}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
              <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(profile.verificationStatus)}`}>
                {getStatusIcon(profile.verificationStatus)}
                {profile.verificationStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Documents</h3>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Document management feature coming soon</p>
            <p className="text-sm text-gray-400 mt-2">You'll be able to upload and manage your documents here</p>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {profile.profileImageUrl ? (
                    <img
                      className="h-20 w-20 rounded-full object-cover"
                      src={profile.profileImageUrl}
                      alt="Profile"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                  )}
                </div>
                <div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Upload className="h-4 w-4 inline mr-2" />
                    Upload Photo
                  </button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 2MB</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                  <p className="text-sm text-gray-900">{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                  <p className="text-sm text-gray-900">{new Date(profile.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Security</h4>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Change Password</p>
                      <p className="text-xs text-gray-500">Update your account password</p>
                    </div>
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
                
                <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentProfile;
