import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { validatePasswordStrength } from '@/utils/auth';
import SignupSuccess from './SignupSuccess';

interface BuyerSignupProps {
  onToggleMode: () => void;
}

const BuyerSignup: React.FC<BuyerSignupProps> = ({ onToggleMode }) => {
  const { signUp } = useAuth();
  const debug = import.meta.env.DEV;
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ email: string; firstName: string; userType: string } | null>(null);

  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [addressDocument, setAddressDocument] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    city: '',
    state: '',
    terms_accepted: false
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'address') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'id') {
        setIdDocument(e.target.files[0]);
      } else {
        setAddressDocument(e.target.files[0]);
      }
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      console.groupCollapsed('[BuyerSignup] Step 1 submit');
      const { password, confirmPassword, ...rest } = formData;
      console.debug('Form data (sanitized):', rest);
      console.groupEnd();
    }
    if (validateStep1()) {
      if (debug) console.info('[BuyerSignup] Step 1 valid -> moving to step 2');
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.terms_accepted) {
      if (debug) console.warn('[BuyerSignup] Terms not accepted');
      toast.error('Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    if (debug) console.groupCollapsed('[BuyerSignup] Final submit');

    try {
      const signUpData = {
        email: formData.email,
        password: formData.password,
        userType: 'buyer',
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        city: formData.city,
        state: formData.state,
        terms_accepted: formData.terms_accepted
      };
      if (debug) {
        const { password, ...safe } = signUpData;
        console.debug('Calling signUp with data:', safe);
      }
      const result = await signUp(signUpData.email, signUpData.password, signUpData);

      if (result.error) {
        if (debug) console.error('[BuyerSignup] signUp error:', result.error);
        const msg = (result.error as string) || 'Signup failed';
        toast.error(msg);
        if (/already\s+exists|already\s+registered|associated/i.test(msg)) {
          setErrors(prev => ({ ...prev, email: 'Email is already registered. Please sign in or use Forgot Password.' }));
          setStep(1);
        }
        return;
      }

      setSuccessData({
        email: formData.email,
        firstName: formData.first_name,
        userType: 'buyer'
      });
      if (debug) console.info('[BuyerSignup] Success -> showing SignupSuccess');
      setShowSuccess(true);
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      if (debug) console.debug('[BuyerSignup] Finalize -> setLoading(false)');
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
                    className={`w-full p-4 border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
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
                    className={`w-full p-4 border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
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
                  className={`w-full p-4 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  placeholder="Enter your email address"
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
                      className={`w-full p-4 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12`}
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
                      className={`w-full p-4 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12`}
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
              Additional Information
            </h3>

            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your phone number"
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
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your city"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select State</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>

              {/* Document Upload */}
              <div className="space-y-4 mt-6">
                <h3 className="font-medium text-gray-800">Identity Verification Documents</h3>
                <p className="text-sm text-gray-600 mb-4">Please upload the following documents for verification:</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Proof (Aadhar/PAN/Passport)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'id')}
                      className="hidden"
                      id="id-document"
                      accept="image/*,.pdf"
                    />
                    <label htmlFor="id-document" className="cursor-pointer">
                      <div className="text-sm text-gray-600">
                        {idDocument ? idDocument.name : 'Click to upload ID proof (PNG, JPG, PDF)'}
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Proof (Utility Bill/Rental Agreement)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'address')}
                      className="hidden"
                      id="address-document"
                      accept="image/*,.pdf"
                    />
                    <label htmlFor="address-document" className="cursor-pointer">
                      <div className="text-sm text-gray-600">
                        {addressDocument ? addressDocument.name : 'Click to upload address proof (PNG, JPG, PDF)'}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="terms_accepted"
                    checked={formData.terms_accepted}
                    onChange={handleInputChange}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4 mt-1"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the <a href="#" className="text-blue-600 hover:underline font-medium">Terms of Service</a> and{' '}
                    <a href="#" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>.
                    I understand that my information will be used to provide property services and may be shared with trusted partners.
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
            className="text-blue-600 hover:underline font-medium"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default BuyerSignup;