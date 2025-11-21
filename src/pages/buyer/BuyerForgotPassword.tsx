import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { pyFetch } from '@/utils/backend';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle, Mail } from 'lucide-react';

const BuyerForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

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
      console.log('Sending forgot password request for buyer:', email);
      
      await pyFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          user_type: 'buyer'
        }),
        headers: { 'Content-Type': 'application/json' },
        useApiKey: false
      });
      
      setSuccess(true);
      toast.success('Password reset email sent to your buyer account!');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      
      // Handle structured error responses
      if (err?.detail && typeof err.detail === 'object') {
        const errorDetail = err.detail;
        if (errorDetail.action === 'wrong_user_type') {
          setError(`This email is registered as a ${errorDetail.actual_user_type}. Please use the ${errorDetail.actual_user_type} login page instead.`);
          toast.error(`Email registered as ${errorDetail.actual_user_type}, not buyer`);
        } else if (errorDetail.action === 'signup') {
          setError('No buyer account found with this email address. Please check your email or sign up for a new buyer account.');
          toast.error('No buyer account found with this email');
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
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Confirm Password Reset</h2>
          <p className="text-muted-foreground">
            Send password reset instructions to your buyer account:
          </p>
          <p className="text-lg font-semibold text-foreground">{email}</p>
          <div className="space-y-3">
            <Button 
              onClick={confirmSendReset} 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </span>
              ) : 'Yes, Send Reset Link'}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setShowConfirmation(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
          <p className="text-muted-foreground">
            We've sent password reset instructions to your buyer account:
          </p>
          <p className="text-lg font-semibold text-foreground">{email}</p>
          <p className="text-sm text-muted-foreground">
            The reset link will expire in 1 hour. If you don't see the email, please check your spam folder.
          </p>
          <div className="space-y-3">
            <Link to="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => {
                setSuccess(false);
                setEmail('');
                setError('');
              }}
            >
              Try another email
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Reset Buyer Password</h2>
          <p className="text-muted-foreground">Enter your email to receive a reset link.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Buyer Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => {
                setEmail(e.target.value);
                setError(''); // Clear error when user types
              }} 
              required 
              placeholder="Enter your buyer email" 
              className={error ? 'border-red-500 focus:border-red-500' : ''}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </span>
            ) : 'Send Reset Link'}
          </Button>
          <div className="text-center space-y-2">
            <Link to="/login" className="block text-sm text-blue-600 hover:underline">
              Back to Sign In
            </Link>
            <p className="text-xs text-muted-foreground">
              Not a buyer? <Link to="/seller/forgot-password" className="text-blue-600 hover:underline">Seller reset</Link> | <Link to="/agent/forgot-password" className="text-blue-600 hover:underline">Agent reset</Link>
            </p>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default BuyerForgotPassword;

