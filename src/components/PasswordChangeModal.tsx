import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { pyFetch } from '@/utils/backend';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (!formData.newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const response = await pyFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword
        }),
        useApiKey: false
      });

      if (response.success) {
        setSuccess(true);
        toast.success('✅ Password changed successfully! An email notification has been sent.', {
          duration: 5000
        });
        setTimeout(() => {
          onClose();
          resetForm();
        }, 3000);
      } else {
        toast.error(response.error || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('[PasswordChange] Error:', error);
      let errorMessage = 'Failed to change password. Please try again.';
      if (error.message?.includes('Invalid') || error.message?.includes('incorrect')) {
        errorMessage = 'Current password is incorrect. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(`❌ ${errorMessage}`, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setSuccess(false);
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
            Change your password securely
          </p>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Password Changed!</h3>
              <p className="text-green-600 mb-2">Your password has been updated successfully.</p>
              <p className="text-sm text-gray-500">An email notification has been sent to your registered email address.</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <Lock className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Change Password</h3>
                <p className="text-sm text-gray-600">Verify your current password and enter a new one</p>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeModal;