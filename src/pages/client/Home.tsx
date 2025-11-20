import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ArrowRight,
  Bed,
  Bath,
  Square,
  Home as HomeIcon,
  DollarSign,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { buildPropertyUrl } from '@/utils/url';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import PopularSearches from '@/components/PopularSearches';
import BecomeAgent from '@/components/BecomeAgent';
import CitySearch from '@/components/CitySearch';

import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { PropertyService } from '@/services/PropertyService';
import type { Property } from '@/services/PropertyService';
import { formatIndianCurrency } from '@/utils/currency';
import toast from 'react-hot-toast';

// Inline SVG placeholder to avoid any network request for fallback images
const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <g fill="#9ca3af" font-family="Segoe UI, Roboto, Arial, sans-serif" text-anchor="middle">
        <text x="400" y="240" font-size="22">No Image Available</text>
      </g>
    </svg>`
  );


interface DashboardStats {
  totalProperties: number;
  totalBookings: number;
  totalInquiries: number;
  recentActivity: any[];
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // State for featured properties
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  // Track images that failed to load so we don't retry the broken URL on re-render
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  // Remove unused cityOptions since we're now using manual state/city selection

  const [filters, setFilters] = useState({
    state: '',
    city: '',
    propertyType: '',
    priceRange: '',
  });

  const slides = [
    {
      title: "Find Your Dream Home",
      subtitle: "Discover the perfect property with Home & Own",
      image: "/slider-2.jpg",
      overlay: "bg-gradient-to-r from-black/70 to-black/40"
    },
    {
      title: "Sell Your Property Faster",
      subtitle: "Connect directly with verified buyers",
      image: "/slider-1.jpg",
      overlay: "bg-gradient-to-r from-black/70 to-black/40"
    },
    {
      title: "Premium Rental Properties",
      subtitle: "Find your perfect rental home today",
      image: "/slider-3.jpg",
      overlay: "bg-gradient-to-r from-black/70 to-black/40"
    },
  ];

  useEffect(() => {
    // Preload hero images once to avoid repeated network requests
    slides.forEach(s => {
      const img = new Image();
      img.src = s.image;
    });

    if (user) {
      fetchDashboardStats();
    } else {
      // For non-logged in users, fetch featured properties
      fetchFeaturedProperties();
    }

    // Fetch cities data regardless of login status
    fetchCitiesData();

    // Fetch total sales for tree planting
    fetchTotalSales();

    // Auto-advance slides
    const slideInterval = setInterval(nextSlide, 5000);

    return () => clearInterval(slideInterval);
  }, [user]);

  // Fetch featured properties via Python API service
  const fetchFeaturedProperties = async () => {
    setLoading(true);
    try {
      const properties = await PropertyService.getFeaturedProperties();
      console.log('[Home] Featured properties received:', Array.isArray(properties) ? properties.length : 'not an array', properties);
      
      // Ensure properties is an array before setting state
      if (Array.isArray(properties)) {
        setFeaturedProperties(properties);
      } else {
        console.warn('[Home] fetchFeaturedProperties received non-array data:', typeof properties, properties);
        setFeaturedProperties([]);
      }
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      toast.error('Failed to load featured properties');
      setFeaturedProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cities data with property counts
  const fetchCitiesData = async () => {
    // Removed cities data fetching as it's not used
  };

  // Fetch total sales count for tree planting progress
  const fetchTotalSales = async () => {
    // Removed total sales fetching as it's not used
  };

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      const { RecordsApi, AdminApi } = await import('@/services/pyApi');
      let stats: DashboardStats = {
        totalProperties: 0,
        totalBookings: 0,
        totalInquiries: 0,
        recentActivity: []
      };

      if ((user as any).user_type === 'seller') {
        // Fetch seller's properties and related stats from Python API
        const allProps = (await RecordsApi.listProperties()) as any[];
        const myProps = Array.isArray(allProps) ? allProps.filter((p: any) => p?.owner_id === (user as any).id) : [];
        stats.totalProperties = myProps.length;

        const propIdSet = new Set(myProps.map((p: any) => p.id));
        const [allBookings, allInquiries] = await Promise.all([
          AdminApi.bookings() as Promise<any[]>,
          AdminApi.inquiries() as Promise<any[]>,
        ]);
        const sellerBookings = (allBookings || []).filter((b: any) => propIdSet.has(b.property_id));
        const sellerInquiries = (allInquiries || []).filter((i: any) => propIdSet.has(i.property_id));
        stats.totalBookings = sellerBookings.length;
        stats.totalInquiries = sellerInquiries.length;
        stats.recentActivity = [...sellerBookings, ...sellerInquiries]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
      } else if ((user as any).user_type === 'buyer') {
        // Fetch buyer's bookings and inquiries via Python API
        const [allBookings, allInquiries] = await Promise.all([
          AdminApi.bookings() as Promise<any[]>,
          AdminApi.inquiries() as Promise<any[]>,
        ]);
        const myBookings = (allBookings || []).filter((b: any) => b.user_id === (user as any).id);
        const myInquiries = (allInquiries || []).filter((i: any) => i.user_id === (user as any).id);
        stats.totalBookings = myBookings.length;
        stats.totalInquiries = myInquiries.length;
        stats.recentActivity = [...myBookings, ...myInquiries]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
      }

      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set empty stats on error
      setDashboardStats({
        totalProperties: 0,
        totalBookings: 0,
        totalInquiries: 0,
        recentActivity: []
      });
    }
  };

  const handleSearch = () => {
    if (!filters.state && !filters.city && !filters.propertyType && !filters.priceRange) {
      toast.error('Please enter at least one search criteria');
      return;
    }

    // Determine which page to redirect to based on current context or default to buy
    const searchParams = new URLSearchParams();
    if (filters.state) searchParams.set('state', filters.state.trim());
    if (filters.city) searchParams.set('city', filters.city.trim());
    if (filters.propertyType) searchParams.set('propertyType', filters.propertyType.trim());
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-');
      if (min) searchParams.set('minPrice', min);
      if (max) searchParams.set('maxPrice', max);
    }

    navigate(`/buy?${searchParams.toString()}`);
  };

  const nextSlide = () => setCurrentSlide(s => (s + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(s => (s - 1 + slides.length) % slides.length);

  const handlePropertyClick = (propertyId: string, title?: string) => {
    if (title) {
      navigate(buildPropertyUrl(title, propertyId));
    } else {
      navigate(`/property/${propertyId}`);
    }
    // Smooth scroll to top with slight delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Render user-specific dashboard
  const renderUserDashboard = () => {
    if (!user || !dashboardStats) return null;

    return (
      <section className="py-12 md:py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#061D58] mb-8">
            Welcome back, {(user as any).first_name || 'User'}! 👋
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {(user as any).user_type === 'seller' && (
              <>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#90C641] mb-2">{dashboardStats.totalProperties}</div>
                  <div className="text-gray-600">My Properties</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#3B5998] mb-2">{dashboardStats.totalBookings}</div>
                  <div className="text-gray-600">Tour Requests</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#FF6B6B] mb-2">{dashboardStats.totalInquiries}</div>
                  <div className="text-gray-600">Inquiries</div>
                </div>
              </>
            )}

            {(user as any).user_type === 'buyer' && (
              <>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#3B5998] mb-2">{dashboardStats.totalBookings}</div>
                  <div className="text-gray-600">My Bookings</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#FF6B6B] mb-2">{dashboardStats.totalInquiries}</div>
                  <div className="text-gray-600">My Inquiries</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#90C641] mb-2">0</div>
                  <div className="text-gray-600">Saved Properties</div>
                </div>
              </>
            )}

            {(user as any).user_type === 'agent' && (
              <>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#90C641] mb-2">12</div>
                  <div className="text-gray-600">Active Listings</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#3B5998] mb-2">8</div>
                  <div className="text-gray-600">Clients</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#FF6B6B] mb-2">₹2.5L</div>
                  <div className="text-gray-600">This Month Commission</div>
                </div>
              </>
            )}

            {(user as any).user_type === 'admin' && (
              <>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#90C641] mb-2">{dashboardStats.totalProperties || 0}</div>
                  <div className="text-gray-600">Total Properties</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#3B5998] mb-2">{dashboardStats.totalBookings || 0}</div>
                  <div className="text-gray-600">Bookings</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <div className="text-3xl font-bold text-[#FF6B6B] mb-2">{dashboardStats.totalInquiries || 0}</div>
                  <div className="text-gray-600">Inquiries</div>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions for User Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(user as any).user_type === 'seller' && (
              <>
                <Link
                  to="/add-property"
                  className="bg-[#90C641] text-white p-4 rounded-lg text-center hover:bg-[#7DAF35] transition-colors"
                >
                  <div className="text-lg font-semibold">Add Property</div>
                  <div className="text-sm opacity-90">List a new property</div>
                </Link>
                <Link
                  to="/my-properties"
                  className="bg-[#3B5998] text-white p-4 rounded-lg text-center hover:bg-[#2d4373] transition-colors"
                >
                  <div className="text-lg font-semibold">My Properties</div>
                  <div className="text-sm opacity-90">Manage listings</div>
                </Link>
              </>
            )}

            {(user as any).user_type === 'buyer' && (
              <>
                <Link
                  to="/buy"
                  className="bg-[#90C641] text-white p-4 rounded-lg text-center hover:bg-[#7DAF35] transition-colors"
                >
                  <div className="text-lg font-semibold">Browse Properties</div>
                  <div className="text-sm opacity-90">Find your dream home</div>
                </Link>
                <Link
                  to="/saved-properties"
                  className="bg-[#3B5998] text-white p-4 rounded-lg text-center hover:bg-[#2d4373] transition-colors"
                >
                  <div className="text-lg font-semibold">Saved Properties</div>
                  <div className="text-sm opacity-90">View favorites</div>
                </Link>
              </>
            )}

            {(user as any).user_type === 'agent' && (
              <>
                <Link
                  to="/agent/dashboard"
                  className="bg-[#90C641] text-white p-4 rounded-lg text-center hover:bg-[#7DAF35] transition-colors"
                >
                  <div className="text-lg font-semibold">Agent Dashboard</div>
                  <div className="text-sm opacity-90">View assignments & performance</div>
                </Link>
                <Link
                  to="/agent/assignments"
                  className="bg-[#3B5998] text-white p-4 rounded-lg text-center hover:bg-[#2d4373] transition-colors"
                >
                  <div className="text-lg font-semibold">My Assignments</div>
                  <div className="text-sm opacity-90">Handle customer inquiries</div>
                </Link>
              </>
            )}

            {(user as any).user_type === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className="bg-[#90C641] text-white p-4 rounded-lg text-center hover:bg-[#7DAF35] transition-colors"
                >
                  <div className="text-lg font-semibold">Admin Dashboard</div>
                  <div className="text-sm opacity-90">View system overview</div>
                </Link>
                <Link
                  to="/admin/users"
                  className="bg-[#3B5998] text-white p-4 rounded-lg text-center hover:bg-[#2d4373] transition-colors"
                >
                  <div className="text-lg font-semibold">Manage Users</div>
                  <div className="text-sm opacity-90">View and edit users</div>
                </Link>
                <Link
                  to="/admin/properties"
                  className="bg-[#FF6B6B] text-white p-4 rounded-lg text-center hover:bg-[#ff5252] transition-colors"
                >
                  <div className="text-lg font-semibold">Manage Properties</div>
                  <div className="text-sm opacity-90">View and edit properties</div>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative h-screen pt-[80px]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
        />
        <div className={`absolute inset-0 ${slides[currentSlide].overlay || 'bg-black/60'}`} />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 -mt-12">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-4">
              {slides[currentSlide].title}
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white font-semibold">
              {slides[currentSlide].subtitle}
            </p>
          </div>

          {/* Search bar */}
          <div className="mt-8 w-full max-w-6xl mx-auto px-4">
            {/* Main Filter Buttons */}
            <div className="flex justify-center mb-6">
              <div className="flex rounded-xl overflow-hidden shadow-lg">
                <Link
                  to="/buy"
                  className="bg-[#0ca5e9] text-white px-4 sm:px-6 lg:px-8 py-3 hover:bg-[#0895d3] transition-all duration-200 font-semibold transform hover:scale-105"
                  onClick={() => {
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Buy
                </Link>
                <Link
                  to="/sell"
                  className="bg-[#162e5a] text-white px-4 sm:px-6 lg:px-8 py-3 hover:bg-[#0f2040] transition-all duration-200 font-semibold transform hover:scale-105"
                  onClick={() => {
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Sell
                </Link>
                <Link
                  to="/rent"
                  className="bg-[#0ca5e9] text-white px-4 sm:px-6 lg:px-8 py-3 hover:bg-[#0895d3] transition-all duration-200 font-semibold transform hover:scale-105"
                  onClick={() => {
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Rent
                </Link>
              </div>
            </div>

            {/* Search Filters */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl mx-auto max-w-full overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
                {/* State Dropdown */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                  <select
                    value={filters.state}
                    onChange={e => setFilters({ ...filters, state: e.target.value, city: '' })}
                    className="w-full p-2.5 sm:p-3 rounded-lg bg-gray-50 text-gray-800 text-sm border border-gray-300 focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] focus:outline-none"
                  >
                    <option value="">Select State</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>

                {/* City Dropdown */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                  <select
                    value={filters.city}
                    onChange={e => setFilters({ ...filters, city: e.target.value })}
                    className="w-full p-2.5 sm:p-3 rounded-lg bg-gray-50 text-gray-800 text-sm border border-gray-300 focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] focus:outline-none disabled:opacity-50"
                    disabled={!filters.state}
                  >
                    <option value="">
                      {filters.state ? 'Select City' : 'Select State First'}
                    </option>
                    {filters.state === 'Telangana' && (
                      <>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Warangal">Warangal</option>
                        <option value="Nizamabad">Nizamabad</option>
                        <option value="Khammam">Khammam</option>
                        <option value="Karimnagar">Karimnagar</option>
                      </>
                    )}
                    {filters.state === 'Andhra Pradesh' && (
                      <>
                        <option value="Visakhapatnam">Visakhapatnam</option>
                        <option value="Vijayawada">Vijayawada</option>
                        <option value="Guntur">Guntur</option>
                        <option value="Tirupati">Tirupati</option>
                        <option value="Nellore">Nellore</option>
                      </>
                    )}
                    {filters.state === 'Maharashtra' && (
                      <>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Pune">Pune</option>
                        <option value="Nagpur">Nagpur</option>
                        <option value="Nashik">Nashik</option>
                        <option value="Aurangabad">Aurangabad</option>
                      </>
                    )}
                    {filters.state === 'Karnataka' && (
                      <>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Mysore">Mysore</option>
                        <option value="Hubli">Hubli</option>
                        <option value="Mangalore">Mangalore</option>
                        <option value="Belgaum">Belgaum</option>
                      </>
                    )}
                    {filters.state === 'Tamil Nadu' && (
                      <>
                        <option value="Chennai">Chennai</option>
                        <option value="Coimbatore">Coimbatore</option>
                        <option value="Madurai">Madurai</option>
                        <option value="Salem">Salem</option>
                        <option value="Trichy">Trichy</option>
                      </>
                    )}
                    {filters.state === 'Delhi' && (
                      <>
                        <option value="Delhi">Delhi</option>
                        <option value="New Delhi">New Delhi</option>
                        <option value="Gurgaon">Gurgaon</option>
                        <option value="Noida">Noida</option>
                      </>
                    )}
                    {filters.state === 'West Bengal' && (
                      <>
                        <option value="Kolkata">Kolkata</option>
                        <option value="Howrah">Howrah</option>
                        <option value="Durgapur">Durgapur</option>
                        <option value="Asansol">Asansol</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Property Type Dropdown */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                  <select
                    value={filters.propertyType}
                    onChange={e => setFilters({ ...filters, propertyType: e.target.value })}
                    className="w-full p-2.5 sm:p-3 rounded-lg bg-gray-50 text-gray-800 text-sm border border-gray-300 focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] focus:outline-none"
                  >
                    <option value="">Property Type</option>
                    <option value="standalone_apartment">Standalone Apartment</option>
                    <option value="gated_apartment">Gated Apartment</option>
                    <option value="independent_house">Independent House</option>
                    <option value="villa">Villa</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                    <option value="farm_house">Farm House</option>
                    <option value="plot">Plot</option>
                  </select>
                </div>

                {/* Price Range Dropdown */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                  <select
                    value={filters.priceRange}
                    onChange={e => setFilters({ ...filters, priceRange: e.target.value })}
                    className="w-full p-2.5 sm:p-3 rounded-lg bg-gray-50 text-gray-800 text-sm border border-gray-300 focus:ring-2 focus:ring-[#0ca5e9] focus:border-[#0ca5e9] focus:outline-none"
                  >
                    <option value="">Price Range</option>
                    <option value="0-2000000">Under ₹20 Lakh</option>
                    <option value="2000000-5000000">₹20L - ₹50L</option>
                    <option value="5000000-10000000">₹50L - ₹1Cr</option>
                    <option value="10000000-20000000">₹1Cr - ₹2Cr</option>
                    <option value="20000000-999999999">Above ₹2Cr</option>
                  </select>
                </div>

                {/* Search & Clear Buttons */}
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-2 flex gap-2">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="flex-1 bg-[#162e5a] text-white px-4 py-2.5 sm:py-3 rounded-lg hover:bg-[#0f2040] flex items-center justify-center gap-2 font-semibold disabled:opacity-60 text-sm transform hover:scale-105 transition-all duration-300 shadow-md focus:ring-2 focus:ring-[#0ca5e9] focus:outline-none"
                  >
                    <Search size={16} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Search</span>
                    <span className="sm:hidden">Search</span>
                  </button>
                  <button
                    onClick={() => setFilters({ state: '', city: '', propertyType: '', priceRange: '' })}
                    className="bg-gray-500 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 p-2 md:p-4 rounded-full text-white hover:bg-[#0ca5e9] transition-all duration-300 transform hover:scale-110 focus:ring-2 focus:ring-white focus:outline-none"
          aria-label="Previous slide"
          aria-describedby="slide-info"
        >
          <ChevronLeft size={20} className="md:w-6 md:h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 p-2 md:p-4 rounded-full text-white hover:bg-[#0ca5e9] transition-all duration-300 transform hover:scale-110 focus:ring-2 focus:ring-white focus:outline-none"
          aria-label="Next slide"
          aria-describedby="slide-info"
        >
          <ChevronRight size={20} className="md:w-6 md:h-6" />
        </button>

        {/* Screen reader only slide information */}
        <div id="slide-info" className="sr-only">
          Slide {currentSlide + 1} of {slides.length}: {slides[currentSlide].title}
        </div>
      </section>

      {/* User Dashboard - Show only if user is logged in */}
      {user && renderUserDashboard()}

      {/* Featured Properties Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Heading */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#162e5a] mb-3 tracking-tight">Featured Properties</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our handpicked selection of premium properties available for sale and rent across India.
            </p>
          </div>

          {/* Loading Spinner */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0ca5e9]"></div>
            </div>
          ) : (
            <>
              {/* Property Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {Array.isArray(featuredProperties) ? featuredProperties.map((property) => (
                  <div
                    key={property.id}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-transform transform hover:-translate-y-1 duration-300 h-full flex flex-col"
                    onClick={() => handlePropertyClick(property.id, property.title)}
                  >
                    {/* Image */}
                    <div className="relative">
                      <img
                        src={failedImageIds[property.id]
                          ? FALLBACK_IMG
                          : (property.images && property.images[0] ? property.images[0] : FALLBACK_IMG)}
                        alt={property.title}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null; // avoid loops
                          img.src = FALLBACK_IMG;
                          setFailedImageIds(prev => ({ ...prev, [property.id]: true }));
                        }}
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-[#0ca5e9] text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                          Featured
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className="bg-[#162e5a] text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                          {property.price ? 'For Sale' : 'For Rent'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col h-full">
                      <h3 className="text-lg font-bold text-[#162e5a] mb-1 line-clamp-2">{property.title}</h3>
                      <p className="text-[#0ca5e9] font-semibold text-lg mb-2">
                        {formatIndianCurrency(property.price || 0)}
                      </p>

                      <div className="flex items-center text-gray-600 text-sm mb-3">
                        <MapPin size={16} className="mr-1 text-[#162e5a]" />
                        <span>{property.address}, {property.city}</span>
                      </div>

                      <div className="flex justify-between text-sm text-gray-500 mb-4">
                        {property.property_type === 'plot' ? (
                          <span className="flex items-center gap-1 col-span-2">
                            <Square size={16} /> {property.area_sqft || 0} sqft Plot
                          </span>
                        ) : (
                          <>
                            <span className="flex items-center gap-1">
                              <Bed size={16} /> {property.bedrooms || 0} Beds
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath size={16} /> {property.bathrooms || 0} Baths
                            </span>
                            <span className="flex items-center gap-1">
                              <Square size={16} /> {property.area_sqft || 0} sqft
                            </span>
                          </>
                        )}
                      </div>

                      <Link
                        to={buildPropertyUrl(property.title, property.id)}
                        className="block w-full text-center bg-[#0ca5e9] text-white py-2 rounded-lg font-medium hover:bg-[#0a92cb] transition-colors duration-200 mt-auto"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                )) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No featured properties available</p>
                  </div>
                )}
              </div>

              {/* View All */}
              <div className="text-center">
                <Link
                  to="/buy"
                  className="inline-flex items-center gap-2 bg-[#162e5a] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0f2340] transition-colors duration-200"
                >
                  View All Properties
                  <ArrowRight size={18} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-[#162e5a] to-[#0b3c74] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to Find Your Dream Home?
            </h2>
            <p className="text-lg md:text-xl text-gray-200 mb-10">
              Join thousands of satisfied customers who found their perfect property with <span className="text-[#0ca5e9] font-semibold">Home & Own</span>
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/buy"
                className="bg-[#0ca5e9] text-white px-8 py-4 rounded-full shadow-md hover:bg-[#0890cb] transition-all duration-300 font-semibold"
              >
                Browse Properties
              </Link>
              <Link
                to="/sell"
                className="bg-white text-[#162e5a] px-8 py-4 rounded-full shadow-md hover:bg-gray-100 transition-all duration-300 font-semibold"
              >
                List Your Property
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#162e5a] mb-4">Why Choose Home & Own</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're revolutionizing the real estate experience in India with our innovative approach
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <HomeIcon className="h-8 w-8 text-white" />,
                title: "Verified Listings",
                desc: "All our properties are verified by our team to ensure authenticity and quality",
              },
              {
                icon: <Users className="h-8 w-8 text-white" />,
                title: "Direct Connection",
                desc: "Connect directly with property owners without middlemen or brokers",
              },
              {
                icon: <DollarSign className="h-8 w-8 text-white" />,
                title: "No Hidden Fees",
                desc: "Transparent pricing with no hidden charges or unexpected fees",
              },
              {
                icon: <DollarSign className="h-8 w-8 text-white" />,
                title: "Best Prices",
                desc: "Competitive pricing with market insights and analysis",
              },
            ].filter(Boolean).map((item, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:border-[#0ca5e9] hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="w-16 h-16 bg-[#0ca5e9] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become an Agent Section */}
      <BecomeAgent />

      {/* Popular Searches Section */}
      <PopularSearches />

      {/* City Search Section */}
      <CitySearch />

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        initialMode="signin"
        userType="buyer"
        requireTermsAcceptance={true}
        enableDocumentUpload={true}
      />
    </div>
  );
};

export default Home;