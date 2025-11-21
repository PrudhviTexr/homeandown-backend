import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pyFetch } from '@/utils/backend';
import { Mail, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const AgentForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSendReset = async () => {
    setShowConfirmation(false);
    setLoading(true);
    setError('');
    
    try {
      console.log('Sending forgot password request for agent:', email);
      
      await pyFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          user_type: 'agent'
        }),
        headers: { 'Content-Type': 'application/json' },
        useApiKey: false
      });
      
      setSuccess(true);
      toast.success('Password reset email sent to your agent account!');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      
      // Handle structured error responses
      if (err?.detail && typeof err.detail === 'object') {
        const errorDetail = err.detail;
        if (errorDetail.action === 'wrong_user_type') {
          setError(`This email is registered as a ${errorDetail.actual_user_type}. Please use the ${errorDetail.actual_user_type} login page instead.`);
          toast.error(`Email registered as ${errorDetail.actual_user_type}, not agent`);
        } else if (errorDetail.action === 'signup') {
          setError('No agent account found with this email address. Please check your email or contact admin to create an agent account.');
          toast.error('No agent account found with this email');
        } else {
          setError(errorDetail.message || 'Failed to send reset email');
          toast.error(errorDetail.message || 'Failed to send reset email');
        }
      } else {
        const errorMessage = err?.detail || err?.message || 'Failed to send reset email. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Confirmation Dialog
  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Password Reset</h2>
              <p className="text-gray-600 mb-4">
                Send password reset instructions to your agent account:
              </p>
              <p className="text-lg font-semibold text-gray-900 mb-6">{email}</p>
              <div className="space-y-3">
                <button
                  onClick={confirmSendReset}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : 'Yes, Send Reset Link'}
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                  className="block w-full text-blue-600 hover:underline disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-600 mb-4">
                We've sent password reset instructions to your agent account:
              </p>
              <p className="text-lg font-semibold text-gray-900 mb-4">{email}</p>
              <p className="text-sm text-gray-500 mb-6">
                If you don't see the email, check your spam folder. The reset link will expire in 1 hour.
              </p>
              <div className="space-y-3">
                <Link 
                  to="/agent/login" 
                  className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Back to Agent Login
                </Link>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                    setError('');
                  }}
                  className="block w-full text-blue-600 hover:underline"
                >
                  Use a different email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Agent Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Agent Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(''); // Clear error when user types
                }}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your agent email"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending reset link...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <ArrowLeft className="h-4 w-4 text-gray-400" />
            <Link to="/agent/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Back to Agent Login
            </Link>
          </div>

          <div className="text-center space-y-2">
            <Link to="/login" className="text-sm text-gray-600 hover:underline">
              Not an agent? Use regular login
            </Link>
            <div className="text-xs text-gray-500">
              <Link to="/buyer/forgot-password" className="text-blue-600 hover:underline">Buyer reset</Link> | 
              <Link to="/seller/forgot-password" className="text-blue-600 hover:underline ml-1">Seller reset</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentForgotPassword;

