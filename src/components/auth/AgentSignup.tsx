import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { validatePasswordStrength } from '@/utils/auth';
import SignupSuccess from './SignupSuccess';
import OTPVerification from './OTPVerification';
import { isFileTypeAllowed, validateFileSize } from '@/utils/imageUpload';
import LocationSelector from '@/components/LocationSelector';

interface AgentSignupProps {
  onToggleMode: () => void;
}

const AgentSignup: React.FC<AgentSignupProps> = ({ onToggleMode }) => {
  const { signUp } = useAuth();
  const debug = import.meta.env.DEV;
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [successData, setSuccessData] = useState<{ email: string; firstName: string; userType: string } | null>(null);
  const [signupResult, setSignupResult] = useState<any>(null); // Store signup result for later use

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    date_of_birth: '',
    city: '',
    state: '',
    district: '',
    mandal: '',
    zip_code: '',
    address: '',
    latitude: '',
    longitude: '',
    experience_years: '',
    specialization: '',
  terms_accepted: false,
  id_proof_file: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const specializations = [
    'Residential Sales',
    'Commercial Sales',
    'Rental Properties',
    'Luxury Properties',
    'Investment Properties',
    'New Construction',
    'Property Management',
    'Industrial Properties',
    'Land/Plot Sales'
  ];

  const experienceOptions = [
    '0-1 years',
    '1-3 years',
    '3-5 years',
    '5-10 years',
    '10+ years'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePasswordStrength(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debug) {
      console.groupCollapsed('[AgentSignup] Step 1 submit');
      const { password, confirmPassword, ...rest } = formData;
      console.debug('Form data (sanitized):', rest);
      console.groupEnd();
    }
    if (validateStep1()) {
      if (debug) console.info('[AgentSignup] Step 1 valid -> moving to step 2');
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.terms_accepted) {
      if (debug) console.warn('[AgentSignup] Terms not accepted');
      toast.error('Please accept the terms and conditions');
      return;
    }

    // Require ID proof file
    if (!formData.id_proof_file) {
      setErrors(prev => ({ ...prev, id_proof_file: 'Please upload a valid ID proof (PNG, JPG, JPEG, or PDF, max 5MB)' }));
      toast.error('ID proof is required');
      return;
    }
    if (!isFileTypeAllowed(formData.id_proof_file)) {
      setErrors(prev => ({ ...prev, id_proof_file: 'Unsupported file type. Allowed: PNG, JPG, JPEG, PDF' }));
      toast.error('Unsupported file type');
      return;
    }
    if (!validateFileSize(formData.id_proof_file)) {
      setErrors(prev => ({ ...prev, id_proof_file: 'File too large. Maximum size is 5MB' }));
      toast.error('File too large');
      return;
    }

    setLoading(true);
    if (debug) console.groupCollapsed('[AgentSignup] Final submit');

    // Validate zipcode is provided (required for agent assignment)
    if (!formData.zip_code || formData.zip_code.length !== 6) {
      setErrors(prev => ({ ...prev, zip_code: 'Please enter a valid 6-digit zipcode to auto-populate location details' }));
      toast.error('Zipcode is required for agent registration');
      return;
    }

    try {
      const signUpData = {
        email: formData.email,
        password: formData.password,
        userType: 'agent',
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        date_of_birth: formData.date_of_birth,
        city: formData.city,
        state: formData.state,
        district: formData.district || '',
        mandal: formData.mandal || '',
        zip_code: formData.zip_code,
        address: formData.address || '',
        latitude: formData.latitude || '',
        longitude: formData.longitude || '',
        experience_years: formData.experience_years,
  specialization: formData.specialization,
  terms_accepted: formData.terms_accepted,
  id_proof_file: formData.id_proof_file,
      };

      if (debug) {
        const { password, ...safe } = signUpData;
        console.debug('Calling signUp with data:', safe);
      }
      const result = await signUp(signUpData.email, signUpData.password, signUpData);

      if (result.error) {
        if (debug) console.error('[AgentSignup] signUp error:', result.error);
        const msg = (result.error as string) || 'Signup failed';
        toast.error(msg);
        if (/already\s+exists|already\s+registered|associated/i.test(msg)) {
          setErrors(prev => ({ ...prev, email: 'Email is already registered. Please sign in or use Forgot Password.' }));
          setStep(1);
        }
        return;
      }

      // Store signup result for later use (after OTP verification)
      setSignupResult(result);

      // Don't upload documents yet - wait until after OTP verification
      // Documents will be uploaded when user is created in database

      // Show OTP verification screen instead of success directly
      setShowOTP(true);
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
  if (debug) console.debug('[AgentSignup] Finalize -> setLoading(false)');
  if (debug) console.groupEnd();
      setLoading(false);
    }
  };

  if (showSuccess && successData) {
    return (
      <SignupSuccess
        email={successData.email}
        firstName={successData.firstName}
        userType={successData.userType}
        onBackToLogin={onToggleMode}
      />
    );
  }

  // Show OTP screen - hide form
  if (showOTP) {
    return (
      <div>
        {/* OTP Verification Modal */}
        <OTPVerification
          isOpen={true}
          onClose={() => setShowOTP(false)}
          email={formData.email}
          onVerify={async () => {
            // Immediately proceed to success page - don't wait for document upload
            setShowOTP(false);
            setSuccessData({
              email: formData.email,
              firstName: formData.first_name,
              userType: 'agent'
            });
            setShowSuccess(true);
            
            // Upload documents in background (non-blocking)
            // This allows user to proceed even if upload fails or takes time
            if (signupResult?.user?.id) {
              setTimeout(async () => {
                try {
                  const { uploadImage } = await import('@/utils/imageUpload');
                  const { pyFetch: pyFetch2 } = await import('@/utils/backend');
                  
                  // Upload ID proof file with retry
                  if (formData.id_proof_file) {
                    try {
                      await uploadImage(formData.id_proof_file, 'user_documents', signupResult.user.id, 'id_proof');
                      console.info('[AgentSignup] ID proof uploaded');
                      
                      // Set verification status to pending
                      try {
                        await pyFetch2(`/api/admin/users/${signupResult.user.id}/verify-status`, {
                          method: 'POST',
                          body: JSON.stringify({ status: 'pending' }),
                          useApiKey: true
                        });
                        console.info('[AgentSignup] Verification status set to pending');
                      } catch (statusError) {
                        console.error('[AgentSignup] Failed to set verification status:', statusError);
                      }
                    } catch (error) {
                      console.error('[AgentSignup] ID proof upload error:', error);
                      // Retry once after 2 seconds
                      setTimeout(async () => {
                        try {
                          await uploadImage(formData.id_proof_file, 'user_documents', signupResult.user.id, 'id_proof');
                          console.log('[AgentSignup] ID proof uploaded on retry');
                        } catch (retryError) {
                          console.error('[AgentSignup] ID proof upload failed after retry:', retryError);
                        }
                      }, 2000);
                    }
                  }
                } catch (uploadError) {
                  console.error('[AgentSignup] Document upload error:', uploadError);
                }
              }, 100);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Personal Information
            </h3>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full p-4 border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                    placeholder="Enter your first name"
                    required
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-sm mt-2">{errors.first_name}</p>
                  )}
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
                    className={`w-full p-4 border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                    placeholder="Enter your last name"
                    required
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-sm mt-2">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full p-4 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                  placeholder="Enter your professional email address"
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2">{errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full p-4 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors pr-12`}
                      placeholder="Create a strong password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-2">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={confirmPasswordVisible ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full p-4 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors pr-12`}
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {confirmPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-2">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#0ca5e9] text-white py-3 px-8 rounded-lg font-semibold hover:bg-[#068ac4] transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Professional Information
            </h3>

            <form onSubmit={handleFinalSubmit} className="space-y-6">
              {/* Note about license generation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Agent License:</strong> Your professional license number (format: H&O001, H&O002, etc.) will be automatically generated and assigned after admin approval. No existing license required for Indian agents.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level *
                  </label>
                  <select
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    required
                  >
                    <option value="">Select Experience Level</option>
                    {experienceOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    required
                  >
                    <option value="">Select Specialization</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              {/* Location Selector with Zipcode Auto-population */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-800 mb-3">
                  <strong>Location Information:</strong> Enter your zipcode (6 digits) to automatically fill all location details. This is required for property assignment matching.
                </p>
                <LocationSelector
                  formData={formData}
                  setFormData={setFormData}
                  handleInputChange={handleInputChange}
                  required={true}
                />
              </div>

              {/* Note about documents */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-800 mb-2">Document Verification</h3>
                <p className="text-sm text-green-700 mb-3">
                  Please upload a valid ID proof. Accepted types: PNG, JPG, JPEG, PDF. Max size: 5MB.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload ID Proof *</label>
                  <input
                    type="file"
                    name="id_proof_file"
                    accept="image/png,image/jpeg,application/pdf"
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${errors.id_proof_file ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-white`}
                    required
                  />
                  {formData.id_proof_file && (
                    <p className="text-xs text-gray-600 mt-1">Selected: {formData.id_proof_file.name} ({(formData.id_proof_file.size/1024).toFixed(1)} KB)</p>
                  )}
                  {errors.id_proof_file && (
                    <p className="text-red-500 text-sm mt-2">{errors.id_proof_file}</p>
                  )}
                </div>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-3">Agent Benefits</h4>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li>• Access to qualified leads and inquiries</li>
                  <li>• Professional agent dashboard and tools</li>
                  <li>• Commission tracking and reporting</li>
                  <li>• Marketing support and resources</li>
                  <li>• Training and certification programs</li>
                </ul>
              </div>

              {/* <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">Account Verification</h4>
                <p className="text-sm text-yellow-800">
                  Your agent account will be reviewed and verified by our team within 24-48 hours.
                  You'll receive an email confirmation once approved.
                </p>
              </div> */}

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="terms_accepted"
                    checked={formData.terms_accepted}
                    onChange={handleInputChange}
                    className="text-purple-600 focus:ring-purple-500 h-4 w-4 mt-1"
                    required
                  />
                   <span className="text-sm text-gray-700">
                     I agree to the <a href="#" className="text-purple-600 hover:underline font-medium">Agent Terms of Service</a> and{' '}
                     <a href="#" className="text-purple-600 hover:underline font-medium">Privacy Policy</a>.
                     I understand the commission structure and professional obligations.
                   </span>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-gray-200 text-gray-700 py-3 px-8 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.terms_accepted}
                  className="bg-[#90C641] text-white py-3 px-8 rounded-lg font-semibold hover:bg-[#7DAF35] transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 text-center border-t border-gray-200 pt-6">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-purple-600 hover:underline font-medium"
          >
            Sign In
          </button>
        </p>
      </div>

    </div>
  );
};

export default AgentSignup;