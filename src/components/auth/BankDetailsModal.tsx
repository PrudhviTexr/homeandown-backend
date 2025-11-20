import React, { useState } from 'react';
import { X, Shield, Phone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const BankDetailsModal: React.FC<BankDetailsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { sendOTP, verifyOTP, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp' | 'bank'>('phone');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showConfirmNumber, setShowConfirmNumber] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: user?.phone_number || '',
    otp: '',
    bank_account_number: '',
    confirm_account_number: '',
    ifsc_code: '',
  });

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(formData.phone, 'bank_update');
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
      const result = await verifyOTP(formData.phone, formData.otp, 'bank_update');
      if (result.success) {
        setStep('bank');
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

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.bank_account_number !== formData.confirm_account_number) {
      toast.error('Account numbers do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await pyFetch('/users/bank-details', {
        method: 'POST',
        body: JSON.stringify({
          bank_account_number: formData.bank_account_number,
          ifsc_code: formData.ifsc_code,
          otp: formData.otp,
          phone: formData.phone
        })
      });

      if (response.success) {
        toast.success('Bank details updated successfully!');
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        toast.error(response.error || 'Failed to update bank details');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update bank details');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      phone: user?.phone_number || '',
      otp: '',
      bank_account_number: '',
      confirm_account_number: '',
      ifsc_code: '',
    });
    setStep('phone');
  };

  const handleBack = () => {
    if (step === 'otp') setStep('phone');
    if (step === 'bank') setStep('otp');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Update Bank Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Secure bank details update with OTP verification
          </p>
        </div>

        <div className="p-6">
          {/* Step 1: Phone Number */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <Phone className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Verify Phone Number</h3>
                <p className="text-sm text-gray-600">We'll send an OTP to verify your identity</p>
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
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Enter OTP</h3>
                <p className="text-sm text-gray-600">
                  OTP sent to {formData.phone}
                </p>
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
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Bank Details */}
          {step === 'bank' && (
            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <Shield className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Bank Details</h3>
                <p className="text-sm text-gray-600">Enter your bank account information</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account Number
                </label>
                <div className="relative">
                  <input
                    type={showAccountNumber ? 'text' : 'password'}
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showAccountNumber ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Account Number
                </label>
                <div className="relative">
                  <input
                    type={showConfirmNumber ? 'text' : 'password'}
                    value={formData.confirm_account_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirm_account_number: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNumber(!showConfirmNumber)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmNumber ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="SBIN0001234"
                  required
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Your bank details are encrypted and secure. They will be used only for commission payments.
                </p>
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
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Bank Details'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankDetailsModal;