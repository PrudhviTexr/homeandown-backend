import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface OTPVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerify: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ isOpen, onClose, email, onVerify }) => {
  const { sendOTP, verifyOTP, getUserProfile } = useAuth();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90); // Changed from 60 to 90 seconds
  const [otpSent, setOtpSent] = useState(false);

  // Send OTP on open
  useEffect(() => {
    if (isOpen && email) {
      sendOTPCode();
    }
  }, [isOpen, email]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && otpSent) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, otpSent]);

  const sendOTPCode = async () => {
    setResending(true);
    try {
      const result = await sendOTP(email, 'email_verification');
      if (result.success) {
        setOtpSent(true);
        setTimeLeft(90); // Reset to 90 seconds
        toast.success('OTP sent to your email');
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '');
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }

    // Prevent double-click/double-submission
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(email, otpString, 'email_verification');
      if (result.success) {
        toast.success('Email verified successfully!');
        
        // Refresh user profile to get updated email_verified status
        try {
          await getUserProfile(true); // Force refresh from server
          console.log('[OTPVerification] User profile refreshed after verification');
        } catch (profileError) {
          console.error('[OTPVerification] Failed to refresh profile:', profileError);
          // Don't block navigation if profile refresh fails
        }
        
        // Call onVerify immediately - don't wait for any async operations
        // This ensures navigation happens right away
        onVerify();
      } else {
        toast.error(result.error || 'Invalid OTP');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch (error) {
      console.error('[OTPVerification] Verify error:', error);
      toast.error('Verification failed. Please try again.');
      // Don't clear OTP on network errors - user might want to retry
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    const digits = pastedData.slice(0, 6).split('');
    setOtp(digits);
    
    // Focus the next empty input or last input
    const nextIndex = Math.min(digits.length, 5);
    const nextInput = document.getElementById(`otp-${nextIndex}`);
    nextInput?.focus();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Verify Your Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-2">
              We've sent a 6-digit verification code to your email:
            </p>
            <p className="font-semibold text-gray-900">{email}</p>
            <p className="text-sm text-gray-500 mt-2">Please check your inbox</p>
          </div>

          {/* OTP Input */}
          <div className="flex gap-2 justify-center mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Resend OTP */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={sendOTPCode}
              disabled={timeLeft > 0 || resending}
              className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {resending ? 'Sending...' : timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend OTP'}
            </button>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;

