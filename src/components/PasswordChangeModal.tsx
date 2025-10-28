import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Phone, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ isOpen, onClose }) => {
  const { user, sendOTP, verifyOTP } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    phone: user?.phone_number || '',
    otp: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(formData.phone, 'password_change');
      if (result.success) {
        setStep('otp');
        toast.success('OTP sent to your phone');
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(formData.phone, formData.otp, 'password_change');
      if (result.success) {
        setStep('password');
        toast.success('OTP verified');
      } else {
        toast.error(result.error || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await pyFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
          otp: formData.otp,
          phone: formData.phone
        })
      });

      if (response.success) {
        setSuccess(true);
        toast.success('Password changed successfully!');
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      } else {
        toast.error(response.error || 'Failed to change password');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      phone: user?.phone_number || '',
      otp: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setStep('phone');
    setSuccess(false);
  };

  const handleBack = () => {
    if (step === 'otp') setStep('phone');
    if (step === 'password') setStep('otp');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden">
        <div className="bg-[#3B5998] text-white p-6 text-center relative">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            <X size={24} />
          </button>
          <Lock className="mx-auto mb-2" size={32} />
          <h2 className="text-xl font-bold">Change Password</h2>
          <p className="text-sm opacity-90 mt-1">
            Secure password change with OTP verification
          </p>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Password Changed!</h3>
              <p className="text-green-600">Your password has been updated successfully.</p>
            </div>
          ) : (
            <>
              {/* Step 1: Phone Verification */}
              {step === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div className="text-center mb-6">
                    <Phone className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Verify Phone</h3>
                    <p className="text-sm text-gray-600">We'll send an OTP for security</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 9440946662"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </form>
              )}

              {/* Step 2: OTP Verification */}
              {step === 'otp' && (
                <form onSubmit={handleOTPSubmit} className="space-y-4">
                  <div className="text-center mb-6">
                    <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Enter OTP</h3>
                    <p className="text-sm text-gray-600">Code sent to {formData.phone}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      6-Digit OTP
                    </label>
                    <input
                      type="text"
                      value={formData.otp}
                      onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-center text-lg tracking-widest"
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Password Change */}
              {step === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="text-center mb-6">
                    <Lock className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Set New Password</h3>
                    <p className="text-sm text-gray-600">Choose a strong password</p>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-9 text-gray-400"
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-9 text-gray-400"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeModal;

import { pyFetch } from '@/utils/backend';