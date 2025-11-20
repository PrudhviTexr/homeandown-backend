
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ApprovalPending from '@/components/ApprovalPending';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [approvalPending, setApprovalPending] = useState(false);
  const [pendingUserType, setPendingUserType] = useState('');
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setApprovalPending(false);

    try {
      console.log('Attempting sign in for:', email);
      
      const result = await signIn(email, password);
      
      if (result.error) {
        console.error('Auth error:', result.error);
        
        // Check if it's an approval pending error
        if (result.error === 'approval_pending') {
          setApprovalPending(true);
          setPendingUserType(result.userType || 'user');
          return;
        }
        
        setError(result.error.message || 'Authentication failed. Please check your credentials.');
      } else {
        console.log('Authentication successful, navigating...');
        // Navigate based on user type
        const userType = result.user?.user_type?.toLowerCase();
        console.log('User type:', userType);
        switch (userType) {
          case 'admin':
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'agent':
            navigate('/agent/dashboard', { replace: true });
            break;
          case 'seller':
            navigate('/seller/dashboard', { replace: true });
            break;
          case 'buyer':
            navigate('/buyer/dashboard', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      }
    } catch (err) {
      console.error('Auth exception:', err);
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  const handleBack = () => {
    // Navigate to homepage instead of using browser back
    navigate('/', { replace: false });
  };

  // Show approval pending component if user is pending approval
  if (approvalPending) {
    return (
      <ApprovalPending 
        userType={pendingUserType}
        email={email}
        onResendVerification={() => {
          // Could implement resend verification logic here
          console.log('Resend verification requested for:', email);
        }}
      />
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <button
          onClick={handleBack}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Sign In to Home & Own</h2>
          <p className="text-muted-foreground">
            Access your real estate account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          <div className="text-center">
            <a className="text-sm text-blue-600 hover:underline" href="/forgot-password">Forgot password?</a>
          </div>
        </form>

        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
          <div className="text-center">
            <h3 className="text-sm font-medium text-foreground mb-2">Demo Credentials</h3>
            <p className="text-xs text-muted-foreground mb-3">Use password123 for all accounts</p>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-background rounded border">
              <div>
                <span className="font-medium">Buyer:</span>
                <div className="text-muted-foreground">buyer@homeandown.com</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('buyer@homeandown.com');
                  setPassword('password123');
                }}
              >
                Use
              </Button>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-background rounded border">
              <div>
                <span className="font-medium">Seller:</span>
                <div className="text-muted-foreground">seller@homeandown.com</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('seller@homeandown.com');
                  setPassword('password123');
                }}
              >
                Use
              </Button>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-background rounded border">
              <div>
                <span className="font-medium">Agent:</span>
                <div className="text-muted-foreground">agent@homeandown.com</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('agent@homeandown.com');
                  setPassword('password123');
                }}
              >
                Use
              </Button>
            </div>
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              For admin access, visit <a href="/admin/login" className="text-blue-600 hover:underline">/admin/login</a>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
