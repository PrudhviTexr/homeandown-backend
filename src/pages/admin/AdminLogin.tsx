import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminLogin: React.FC = () => {
  const { signIn, signOut, getUserProfile, devSignIn } = useAuth() as any;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate admin credentials before attempting sign in
      if (!formData.email || !formData.password) {
        toast.error('Please enter both email and password');
        setLoading(false);
        return;
      }

      // In development, try the devSignIn shortcut first (hardcoded credentials)
      let result: any = null;
      if (import.meta.env?.DEV && typeof devSignIn === 'function') {
        result = await devSignIn(formData.email, formData.password);
      }
      if (!result || result.error) {
        // Fall back to normal sign in
        result = await signIn(formData.email, formData.password);
      }
      console.debug('[ADMIN LOGIN] signIn result:', result);
  console.debug('[ADMIN LOGIN] signIn result:', result);

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

  // Use the returned user directly when available to avoid a race with context state.
  // Only fetch the profile if the signIn result didn't include a user.
  const userProfile = (result as any).user ?? (await getUserProfile(true));
  if (!userProfile || String(userProfile.user_type || '').toLowerCase() !== 'admin') {
        toast.error('Access denied. This portal is restricted to administrators only.');
        await signOut();
        setLoading(false);
        return;
      }
      // Success - force a fresh profile fetch from the backend to avoid cookie/token races
      toast.success('Welcome to Admin Dashboard!');
      const maxRetries = 8; // ~1.6s total with 200ms delay
      let navigated = false;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Force a backend fetch which will update AuthContext
          const latest = await getUserProfile(true);
          console.debug('[ADMIN LOGIN] Forced profile fetch result:', latest);
          if (latest && String(latest.user_type || '').toLowerCase() === 'admin') {
            navigate('/admin', { replace: true });
            navigated = true;
            break;
          }
        } catch (err) {
          // ignore and retry
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise(res => setTimeout(res, 200));
      }

      if (!navigated) {
        console.warn('[ADMIN LOGIN] Timed out waiting for admin profile; navigating anyway');
        navigate('/admin', { replace: true });
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061D58] via-[#0A2351] to-[#163169] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#061D58] text-white p-8">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-blue-200 mt-2">Secure access to Home & Own admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter admin email"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                placeholder="Enter your password"
                required
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
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#061D58] text-white py-4 rounded-lg font-semibold hover:bg-[#0A2351] transition-colors disabled:opacity-50 flex items-center justify-center text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Signing In...
              </>
            ) : 'SIGN IN'}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              <strong>Admin Credentials:</strong><br />
              Email: admin@homeandown.com<br />
              Password: Frisco@2025
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link to="/" className="text-blue-600 hover:underline">
              Return to Home Page
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;