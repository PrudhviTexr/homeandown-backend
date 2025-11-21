import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pyFetch } from '@/utils/backend';
import toast from 'react-hot-toast';

const AdminForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await pyFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          user_type: 'admin'
        }),
        headers: { 'Content-Type': 'application/json' },
        useApiKey: false
      });
      
      setSuccess(true);
      toast.success('If an admin account exists for this email, a reset link has been sent.');
    } catch (err) {
      console.error('Forgot password error:', err);
      toast.error('Failed to send reset email. Please try again.');
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
            <h1 className="text-2xl font-bold">Check Your Email</h1>
          </div>
          
          <div className="p-8 text-center">
            <p className="text-gray-700 mb-6">
              If an admin account exists for <strong>{email}</strong>, we've sent password reset instructions to that email address.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Please check your email and follow the link to reset your password. The link will expire in 1 hour.
            </p>
            <div className="space-y-3">
              <Link 
                to="/admin/login" 
                className="block w-full bg-[#061D58] text-white py-3 rounded-lg font-semibold hover:bg-[#0A2351] transition-colors"
              >
                Back to Login
              </Link>
              <button
                onClick={() => setSuccess(false)}
                className="block w-full text-blue-600 hover:underline"
              >
                Try another email
              </button>
            </div>
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
          <p className="text-blue-200 mt-2">Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Admin Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your admin email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#061D58] text-white py-4 rounded-lg font-semibold hover:bg-[#0A2351] transition-colors disabled:opacity-50 flex items-center justify-center text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Sending...
              </>
            ) : 'Send Reset Link'}
          </button>

          <div className="mt-6 text-center space-y-3">
            <Link to="/admin/login" className="block text-blue-600 hover:underline">
              Back to Admin Login
            </Link>
            <Link to="/" className="block text-gray-600 hover:underline text-sm">
              Return to Home Page
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminForgotPassword;

