import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pyFetch } from '@/utils/backend';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const siteUrl = (import.meta as any).env?.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Request password reset via Python API. Backend will email a tokenized link to /reset-password
      const payload = { email: email.toLowerCase().trim(), redirect_url: `${siteUrl}/reset-password` };
      await pyFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });
      setSuccess('If an account exists for this email, a reset link has been sent. Please check your inbox.');
    } catch (err) {
      setError('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Forgot Password</h2>
          <p className="text-muted-foreground">Enter your email to receive a reset link.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
          </div>
          {error && (
            <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
          )}
          {success && (
            <Alert variant="default"><AlertDescription>{success}</AlertDescription></Alert>
          )}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending…' : 'Send Reset Link'}</Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/login')}>Back to Sign In</Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
