import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { pyFetch } from '@/utils/backend';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const AdminResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    setToken(t);
    if (!t) {
      toast.error('Invalid reset link. Please request a new password reset.');
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!token) {
      toast.error('Missing reset token. Please request a new reset email.');
      return;
    }

    setLoading(true);
    try {
      await pyFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: newPassword }),
        headers: { 'Content-Type': 'application/json' },
        useApiKey: false
      });
      
      setSuccess(true);
      toast.success('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/admin/login', { replace: true }), 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error('Failed to reset password. The link may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#061D58] via-[#0A2351] to-[#163169] flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-green-600 text-white p-8 text-center">
            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Password Reset Successful!</h1>
          </div>
          
          <div className="p-8 text-center">
            <p className="text-gray-700 mb-6">
              Your admin password has been successfully reset. You can now log in with your new password.
            </p>
            <Link 
              to="/admin/login" 
              className="block w-full bg-[#061D58] text-white py-3 rounded-lg font-semibold hover:bg-[#0A2351] transition-colors"
            >
              Go to Admin Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061D58] via-[#0A2351] to-[#163169] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#061D58] text-white p-8">
          <h1 className="text-2xl font-bold">Reset Admin Password</h1>
          <p className="text-blue-200 mt-2">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                placeholder="Enter new password (min 8 characters)"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-[#061D58] text-white py-4 rounded-lg font-semibold hover:bg-[#0A2351] transition-colors disabled:opacity-50 flex items-center justify-center text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Resetting...
              </>
            ) : 'Reset Password'}
          </button>

          <div className="mt-6 text-center">
            <Link to="/admin/login" className="text-blue-600 hover:underline">
              Back to Admin Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminResetPassword;

