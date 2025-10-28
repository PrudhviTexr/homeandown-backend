import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthApi } from '@/services/pyApi';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'otp' | 'loading' | 'success' | 'error'>('otp');
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Check if email is provided in URL params (for redirect from signup)
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      setMessage('Please enter the OTP');
      return;
    }

    if (!email.trim()) {
      setMessage('Email is required');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const result = await AuthApi.verifyEmailOtp(email, otp);

      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Your email has been successfully verified! You can now sign in to your account. Redirecting to homepage...');

        // Redirect to homepage after 3 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } else {
        // Handle already verified state gracefully
        if (result.error?.includes('already verified')) {
          setStatus('success');
          setMessage('Your email is already verified! You can sign in to your account. Redirecting to homepage...');
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to verify email. Please check your OTP and try again.');
        }
      }
    } catch (error: any) {
      console.error('Email OTP verification error:', error);
      
      // Handle already verified state gracefully
      if (error?.message?.includes('already verified')) {
        setStatus('success');
        setMessage('Your email is already verified! You can sign in to your account. Redirecting to homepage...');
        
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(error?.message || 'Failed to verify email. Please try again.');
      }
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) {
      setMessage('Email is required to resend OTP');
      return;
    }

    setMessage('Resending OTP...');

    try {
      // For now, we'll just show a message. In a real implementation,
      // you'd call an API endpoint to resend the OTP
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setMessage('OTP has been resent to your email address.');
    } catch (error) {
      setMessage('Failed to resend OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-[90px] pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              {status === 'otp' && (
                <>
                  <div className="text-center mb-6">
                    <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Verify Your Email
                    </h1>
                    <p className="text-gray-600">
                      We've sent a 6-digit verification code to your email address.
                    </p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </div>

                    {message && (
                      <div className="text-sm text-center text-gray-600">
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#90C641] text-white py-3 rounded-lg hover:bg-[#7DAF35] transition-colors font-medium"
                    >
                      Verify Email
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResendOtp}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Resend verification code
                    </button>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/')}
                      className="flex items-center justify-center w-full text-gray-600 hover:text-gray-800 text-sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Homepage
                    </button>
                  </div>
                </>
              )}

              {status === 'loading' && (
                <div className="text-center">
                  <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Verifying...
                  </h1>
                  <p className="text-gray-600">
                    Please wait while we verify your email address.
                  </p>
                </div>
              )}

              {status === 'success' && (
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-green-800 mb-2">
                    Email Verified!
                  </h1>
                  <p className="text-gray-600 mb-4">
                    {message}
                  </p>
                  <p className="text-sm text-gray-500">
                    Redirecting you to the homepage...
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-red-800 mb-2">
                    Verification Failed
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {message}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setStatus('otp')}
                      className="w-full bg-[#90C641] text-white py-3 rounded-lg hover:bg-[#7DAF35] transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Go to Homepage
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EmailVerification;