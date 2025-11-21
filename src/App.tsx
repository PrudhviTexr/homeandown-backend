import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; 
import toast from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

import Home from './pages/client/Home';
import Buy from './pages/client/Buy';
import Rent from './pages/client/Rent';
import Sell from './pages/client/Sell';
import Agents from './pages/client/Agents';
import PropertyDetails from './pages/client/PropertyDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminRouteGuard from './components/AdminRouteGuard';
import AgentRouteGuard from './components/AgentRouteGuard';
import ClientRouteGuard from './components/ClientRouteGuard';
import About from './pages/client/About';
import Host from './pages/client/Host';
import Community from './pages/client/Community';
import MyBookings from './pages/client/MyBookings';
import MyInquiries from './pages/client/MyInquiries';
import EmailVerification from './pages/EmailVerification';
import AgentAssignments from './pages/agent/AgentAssignments';
import AgentDashboard from './pages/agent/AgentDashboard'; 
import Profile from './pages/client/Profile';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';

import SellerDashboard from './pages/seller/SellerDashboard';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import BuyerForgotPassword from './pages/buyer/BuyerForgotPassword';
import SellerForgotPassword from './pages/seller/SellerForgotPassword';
import AgentForgotPassword from './pages/agent/AgentForgotPassword';
import AdminForgotPassword from './pages/admin/AdminForgotPassword';
import MyProperties from './pages/MyProperties';
import AddProperty from './pages/AddProperty';
import PropertyManagement from './pages/property-management/PropertyManagement';
import AddNRIProperty from './pages/property-management/AddNRIProperty';
import RentProperty from './pages/property-management/RentProperty';
import MaintenanceRequests from './pages/property-management/MaintenanceRequests';
import NotFound from './pages/NotFound';

function AppRoutes() {
  // Safely get auth context - handle case where it might not be available yet
  let user, loading, getUserProfile;
  try {
    const auth = useAuth();
    user = auth.user;
    loading = auth.loading;
    getUserProfile = auth.getUserProfile;
  } catch (error) {
    // If useAuth fails, provide defaults
    console.warn('[AppRoutes] Auth context not available yet:', error);
    user = null;
    loading = true;
    getUserProfile = async () => null;
  }
  
  const navigate = useNavigate();
  const location = useLocation();

  // Removed automatic redirect logic - let users access their appropriate sections
  // through proper navigation and route guards

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/buy" element={<Buy />} />
      <Route path="/rent" element={<Rent />} />
      <Route path="/sell" element={<Sell />} />
      <Route path="/about" element={<About />} />
      <Route path="/host" element={<Host />} />
      <Route path="/community" element={<Community />} />
      <Route path="/agents" element={<Agents />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
      <Route path="/my-bookings" element={<ClientRouteGuard><MyBookings /></ClientRouteGuard>} />
      <Route path="/my-inquiries" element={<ClientRouteGuard><MyInquiries /></ClientRouteGuard>} />
      <Route path="/email-verification" element={<EmailVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/buyer/forgot-password" element={<BuyerForgotPassword />} />
      <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
      <Route path="/agent/forgot-password" element={<AgentForgotPassword />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<ClientRouteGuard><Profile /></ClientRouteGuard>} />
      <Route path="/wishlist" element={<ClientRouteGuard><Wishlist /></ClientRouteGuard>} />
      <Route path="/notifications" element={<ClientRouteGuard><Notifications /></ClientRouteGuard>} />
      <Route path="/agent/assignments" element={<AgentRouteGuard><AgentAssignments /></AgentRouteGuard>} />
      <Route path="/agent/dashboard/*" element={<AgentRouteGuard><AgentDashboard /></AgentRouteGuard>} />
      <Route path="/agent/dashboard" element={<AgentRouteGuard><AgentDashboard /></AgentRouteGuard>} />
      
          {/* Buyer Dashboard */}
          <Route path="/buyer/dashboard" element={<ClientRouteGuard allowedUserTypes={['buyer']}><BuyerDashboard /></ClientRouteGuard>} />
          
          {/* Seller Dashboard */}
          <Route path="/seller/dashboard" element={<ClientRouteGuard allowedUserTypes={['seller']}><SellerDashboard /></ClientRouteGuard>} />

      {/* Property Management Routes */}
      <Route path="/property-management" element={<PropertyManagement />} />
      
      {/* Property Management Functional Routes - Require Seller/Agent Authentication */}
      <Route path="/my-properties" element={<ClientRouteGuard allowedUserTypes={['seller', 'agent']}><MyProperties /></ClientRouteGuard>} />
      <Route path="/add-property" element={<ClientRouteGuard allowedUserTypes={['seller', 'agent']}><AddProperty /></ClientRouteGuard>} />
      <Route path="/edit-property/:id" element={<ClientRouteGuard allowedUserTypes={['seller', 'agent', 'admin']}><AddProperty /></ClientRouteGuard>} />
      <Route path="/create-property" element={<ClientRouteGuard allowedUserTypes={['seller', 'agent', 'admin']}><AddProperty /></ClientRouteGuard>} />
      <Route path="/property-management/my-properties" element={<ClientRouteGuard allowedUserTypes={['seller', 'agent']}><MyProperties /></ClientRouteGuard>} />
      <Route path="/property-management/add-nri-property" element={<ClientRouteGuard allowedUserTypes={['seller', 'agent']}><AddNRIProperty /></ClientRouteGuard>} />
      <Route path="/property-management/rent-property" element={<ClientRouteGuard allowedUserTypes={['seller', 'agent']}><RentProperty /></ClientRouteGuard>} />
      <Route path="/property-management/maintenance" element={<ClientRouteGuard allowedUserTypes={['seller', 'agent']}><MaintenanceRequests /></ClientRouteGuard>} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
      <Route path="/admin/*" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

// Export AppRoutes separately for testing if needed
export { AppRoutes };

export default App;