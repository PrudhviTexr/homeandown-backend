import React, { useState } from 'react';
import { X } from 'lucide-react';
import { pyFetch } from '@/utils/backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: string; // Optional user type for role-specific reset
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  userType
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = { 
        email: email.toLowerCase().trim()
      };
      
      // Add user type if provided
      if (userType) {
        payload.user_type = userType;
      }

      await pyFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        useApiKey: false
      });

      setSuccess('Password reset email sent successfully! Please check your inbox.');
      setEmail(''); // Clear form
      
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 3000);

    } catch (err: any) {
      console.error('Forgot password error:', err);
      
      // Extract error message from various possible formats
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      // Try to extract from err.message (pyFetch throws Error with message)
      if (err?.message) {
        const msg = err.message;
        // Try to parse JSON from the message (pyFetch may include JSON in error message)
        try {
          const parsed = JSON.parse(msg);
          errorMessage = parsed?.detail || parsed?.message || msg;
        } catch {
          // Not JSON, use the message directly
          errorMessage = msg;
        }
      } else if (err?.detail) {
        errorMessage = err.detail;
      } else if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Clean up the error message - remove status codes and extra info
      errorMessage = errorMessage.replace(/^.*?\{/, '{').replace(/\}.*$/, '}');
      try {
        const parsed = JSON.parse(errorMessage);
        errorMessage = parsed?.detail || parsed?.message || errorMessage;
      } catch {
        // Not JSON, keep as is
      }
      
      // Check for specific error patterns and use the exact message from backend
      if (errorMessage.includes('No user found') || 
          errorMessage.includes('not found') || 
          errorMessage.includes('sign up') ||
          errorMessage.includes('No ') && errorMessage.includes('account found')) {
        // Use the exact message from backend
        setError(errorMessage);
      } else if (errorMessage.includes('404') || errorMessage.includes('NetworkError')) {
        if (errorMessage.includes('NetworkError')) {
          setError('Cannot connect to server. Please check your internet connection and try again.');
        } else {
          setError('No account found with this email address. Please sign up for a new account.');
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Forgot Password
            {userType && <span className="text-sm text-gray-500 ml-2">({userType})</span>}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="mt-1"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          <p>We'll send you a link to reset your password if an account exists with this email.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
