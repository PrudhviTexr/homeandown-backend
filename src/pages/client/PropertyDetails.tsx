import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { extractSlugFromParam } from '@/utils/url';
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  User,
  Star,
  Calendar,
  Home as HomeIcon,
  Car,
  Wifi,
  Dumbbell,
  Shield,
  Zap,
  Waves,
  TreePine,
  Camera,
  Video,
  ArrowLeft,
  Mail,
  Phone,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import TourBookingModal from '@/components/TourBookingModal';
import PropertyActionButtons from '@/components/PropertyActionButtons';
import ImageGallery from '@/components/ImageGallery';
import UserInfo from '@/components/UserInfo'; // Import the new component
import { useAuth } from '@/contexts/AuthContext';
import ApiService from '@/services/api';
import { formatIndianCurrency } from '@/utils/currency';
import toast from 'react-hot-toast';
import LocationService from '@/services/locationService';
import { pyFetch } from '@/utils/backend';

// Leaflet marker fix
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PropertyDetails: React.FC = () => {
  const params = useParams<{ id: string }>();
  const slug = extractSlugFromParam(params.id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [agentInfo, setAgentInfo] = useState<any>(null);

  const nextImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  useEffect(() => {
    // Scroll to top when component mounts
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    if (slug) {
      fetchPropertyDetails();
    }
  }, [slug]);

  const fetchPropertyDetails = async () => {
    if (!slug) return;
    
    setLoading(true);
    try {
      const data = await ApiService.getProperty(slug);

      if (data) {
        // Add additional UI-specific properties
        const enhancedProperty = {
          ...data,
          floor: data.floor || 'Ground Floor',
          facing: (data.property_type === 'independent_house' || data.property_type === 'villa') ? (data.facing || 'East') : data.facing,
          rera_id: data.rera_id || 'Not Available',
          videos: [],
          amenities: data.amenities ? (data.amenities || []).map((amenity: string) => ({
            icon: getAmenityIcon(amenity),
            name: amenity
          })) : [
            { icon: <Zap size={16} />, name: 'Power Backup' },
            { icon: <Shield size={16} />, name: '24/7 Security' },
            { icon: <Car size={16} />, name: 'Parking' },
          ],
          nearbyHighlights: data.nearby_highlights ? (data.nearby_highlights || []).map((highlight: string) => ({
            icon: getNearbyIcon(highlight),
            name: highlight
          })) : [
            { icon: <HomeIcon size={16} />, name: 'School' },
            { icon: <HomeIcon size={16} />, name: 'Hospital' },
            { icon: <HomeIcon size={16} />, name: 'Shopping Mall' },
          ],
          similarProperties: [] // Will be populated separately if needed
        };

        setProperty(enhancedProperty);
        
        // Fetch agent information if available
        await fetchAgentInfo(enhancedProperty);
        
        // Fetch coordinates if not available but pincode exists
        await fetchCoordinatesForMap(enhancedProperty);
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      toast.error('Failed to load property details');
      setProperty(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentInfo = async (propertyData: any) => {
    // Check if agent info is already in property data
    if (propertyData.assigned_agent && propertyData.assigned_agent.id) {
      setAgentInfo(propertyData.assigned_agent);
      console.log('[PropertyDetails] Using agent info from property data');
      return;
    }
    
    // Try to fetch agent info using agent_id or assigned_agent_id
    const agentId = propertyData.assigned_agent_id || propertyData.agent_id;
    if (agentId) {
      try {
        console.log('[PropertyDetails] Fetching agent info for agent_id:', agentId);
        const agentData = await pyFetch(`/api/users/${agentId}`, {
          method: 'GET',
          useApiKey: false
        });
        if (agentData && agentData.user_type === 'agent') {
          setAgentInfo(agentData);
          console.log('[PropertyDetails] Fetched agent info:', agentData);
        } else {
          console.warn('[PropertyDetails] User is not an agent:', agentData?.user_type);
        }
      } catch (error) {
        console.error('[PropertyDetails] Error fetching agent info:', error);
      }
    } else {
      console.log('[PropertyDetails] No agent assigned to this property');
    }
  };

  const fetchCoordinatesForMap = async (propertyData: any) => {
    // Check if coordinates already exist and are valid
    let lat = propertyData.latitude ? parseFloat(String(propertyData.latitude)) : null;
    let lng = propertyData.longitude ? parseFloat(String(propertyData.longitude)) : null;
    
    // Validate coordinates are numbers and within valid ranges
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      // Ensure coordinates are within valid ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        // Valid coordinates exist, use them
        setMapCoordinates({ lat, lng });
        console.log('[PropertyDetails] Using existing coordinates:', { lat, lng });
        return;
      } else {
        console.warn('[PropertyDetails] Coordinates out of valid range:', { lat, lng });
        // Reset invalid coordinates
        lat = null;
        lng = null;
      }
    }
    
    // If no valid coordinates, try to fetch from pincode
    const pincode = propertyData.zip_code || propertyData.pincode || propertyData.zipcode;
    if (pincode && pincode.length >= 6) {
      setMapLoading(true);
      try {
        console.log('[PropertyDetails] Fetching coordinates for pincode:', pincode);
        const locationService = LocationService.getInstance();
        const coords = await locationService.getCoordinatesFromPincode(pincode);
        
        if (coords && coords.lat && coords.lng && !isNaN(coords.lat) && !isNaN(coords.lng)) {
          // Validate fetched coordinates
          if (coords.lat >= -90 && coords.lat <= 90 && coords.lng >= -180 && coords.lng <= 180) {
            setMapCoordinates(coords);
            console.log('[PropertyDetails] Fetched coordinates from pincode:', coords);
          } else {
            console.warn('[PropertyDetails] Fetched coordinates out of range:', coords);
            setMapCoordinates({ lat: 17.3850, lng: 78.4867 });
          }
        } else {
          console.warn('[PropertyDetails] Could not fetch coordinates for pincode:', pincode);
          // Set default coordinates (Hyderabad) as fallback
          setMapCoordinates({ lat: 17.3850, lng: 78.4867 });
        }
      } catch (error) {
        console.error('[PropertyDetails] Error fetching coordinates:', error);
        // Set default coordinates (Hyderabad) as fallback
        setMapCoordinates({ lat: 17.3850, lng: 78.4867 });
      } finally {
        setMapLoading(false);
      }
    } else {
      // No pincode available, use default coordinates
      console.warn('[PropertyDetails] No pincode available, using default coordinates');
      setMapCoordinates({ lat: 17.3850, lng: 78.4867 });
    }
  };

  // Helper functions for icons
  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'Power Backup': <Zap size={16} />,
      'Security': <Shield size={16} />,
      'Parking': <Car size={16} />,
      'WiFi': <Wifi size={16} />,
      'Gym': <Dumbbell size={16} />,
      'Swimming Pool': <Waves size={16} />,
      'Garden': <TreePine size={16} />,
    };
    return iconMap[amenity] || <HomeIcon size={16} />;
  };

  const getNearbyIcon = (highlight: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'School': <HomeIcon size={16} />,
      'Hospital': <HomeIcon size={16} />,
      'Shopping Mall': <HomeIcon size={16} />,
      'Metro Station': <HomeIcon size={16} />,
      'Park': <TreePine size={16} />,
    };
    return iconMap[highlight] || <HomeIcon size={16} />;
  };

  const handleQuickInquiry = async (retryCount = 0) => {
    console.log('[PropertyDetails] handleQuickInquiry called');
    console.log('[PropertyDetails] User:', user);
    console.log('[PropertyDetails] Property:', property);
    
    if (!property) {
      console.log('[PropertyDetails] No property data');
      toast.error('Property information is not available. Please refresh the page.');
      return;
    }

    // If user is not logged in, show auth modal
    if (!user) {
      console.log('[PropertyDetails] No user, showing auth modal');
      setShowAuthModal(true);
      return;
    }

    // Validate required user information
    if (!user.email) {
      toast.error('Email is required. Please update your profile.');
      return;
    }

    // Validate phone number - use a default if not available
    const phoneNumber = user.phone_number || user.phone || '';
    if (!phoneNumber || phoneNumber.trim() === '') {
      toast.error('Phone number is required. Please update your profile with a valid phone number.');
      return;
    }

    const userName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`.trim()
      : user.first_name || user.last_name || user.email?.split('@')[0] || 'User';

    console.log('[PropertyDetails] Using phone number:', phoneNumber);
    console.log('[PropertyDetails] User name:', userName);

    console.log('[PropertyDetails] Starting inquiry creation...');
    setInquiryLoading(true);
    try {
      const inquiryData = {
        property_id: property.id,
        name: userName,
        email: user.email,
        phone: phoneNumber,
        message: `Hi, I'm interested in this property: ${property.title}. Please contact me with more details.`,
        inquiry_type: 'general'
      };

      console.log('[PropertyDetails] Sending inquiry with data:', inquiryData);
      const result = await ApiService.createInquiry(inquiryData);

      console.log('[PropertyDetails] Inquiry API response:', result);

      // Check if inquiry was successful
      if (result?.success === false || result?.error || result?.detail) {
        const errorMsg = result?.error || result?.detail || 'Failed to send inquiry. Please try again.';
        toast.error(`❌ ${errorMsg}`, {
          duration: 6000,
        });
        setInquiryLoading(false);
        return;
      }

      // Get inquiry ID from result
      const inquiryId = result?.id || result?.inquiry?.id;
      
      // Show immediate success message with confirmation
      toast.success(
        (t) => (
          <div className="flex flex-col">
            <div className="font-semibold">✅ Request Sent!</div>
            <div className="text-sm mt-1">
              Your inquiry for <strong>{property.title}</strong> has been submitted successfully.
            </div>
            <div className="text-xs mt-1 text-gray-600">
              The agent will contact you soon.
            </div>
            {inquiryId && (
              <div className="text-xs mt-1 text-gray-500">
                Inquiry ID: {inquiryId.substring(0, 8)}...
              </div>
            )}
          </div>
        ),
        {
          duration: 6000,
          icon: '🎉',
        }
      );
      console.log('[PropertyDetails] Inquiry sent successfully:', result);
      
      // Reset loading state immediately
      setInquiryLoading(false);
      
      // Navigate to My Inquiries page to see the inquiry details (only if user is logged in)
      if (user) {
        setTimeout(() => {
          window.location.href = '/my-inquiries';
        }, 2000);
      }
    } catch (error: any) {
      console.error('[PropertyDetails] Error sending inquiry:', error);
      
      // Retry logic for network failures (max 2 retries)
      if (retryCount < 2 && (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch'))) {
        toast.error('Network error. Retrying...', { duration: 3000 });
        setTimeout(() => {
          handleQuickInquiry(retryCount + 1);
        }, 1000 * (retryCount + 1));
        setInquiryLoading(false);
        return;
      }
      
      // User-friendly error messages - ALWAYS show notification
      let errorMessage = 'Failed to send inquiry. Please try again.';
      if (error.message?.includes('NetworkError')) {
        errorMessage = 'Unable to reach the server. Please check your internet connection and try again.';
      } else if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
        errorMessage = 'Server error occurred. Please try again in a few moments.';
      } else if (error.message?.includes('does not exist') || error.message?.includes('edge_functions_invoke')) {
        errorMessage = 'Service temporarily unavailable. Our team has been notified. Please try again later.';
      } else if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
        errorMessage = 'Invalid inquiry details. Please check your information and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Always show error notification
      toast.error(`❌ ${errorMessage}`, {
        duration: 6000, // Show for 6 seconds
      });
    } finally {
      setInquiryLoading(false);
    }
  };



  // Helper function to determine the area unit (sqft, sqyd, or acres)
  const getAreaUnit = (): 'sqft' | 'sqyd' | 'acres' => {
    if (!property) return 'sqft';
    
    // For apartments, default to sqft
    const apartmentTypes = ['standalone_apartment', 'gated_apartment', 'new_apartment'];
    if (apartmentTypes.includes(property.property_type)) {
      return 'sqft';
    }
    
    // For land/plot/farm_house, default to sqyd for plot area
    const plotTypes = ['land', 'plot', 'farm_house'];
    if (plotTypes.includes(property.property_type)) {
      // Check if plot_area_sqyd exists, use sqyd
      if (property.plot_area_sqyd && parseFloat(String(property.plot_area_sqyd)) > 0) {
        return 'sqyd';
      }
    }
    
    // First, check if area_unit is stored in the property
    if (property.area_unit && ['sqft', 'sqyd', 'acres'].includes(property.area_unit)) {
      return property.area_unit as 'sqft' | 'sqyd' | 'acres';
    }
    
    // Infer from data - prioritize the unit with the most meaningful value
    if (property.area_acres && parseFloat(String(property.area_acres)) > 0) {
      return 'acres';
    }
    if (property.area_sqyd && parseFloat(String(property.area_sqyd)) > 0) {
      return 'sqyd';
    }
    // Default to sqft
    return 'sqft';
  };

  // Helper function to get area value and unit label
  const getAreaDisplay = (areaType: 'main' | 'plot' | 'builtup' | 'carpet' = 'main') => {
    if (!property) return { value: null, unit: 'sqft', display: 'N/A' };
    
    const unit = getAreaUnit();
    
    let value: number | null = null;
    let label = '';
    
    if (areaType === 'plot') {
      // For plot area: land/plot/farm_house use sqyd, others use sqft
      const plotTypes = ['land', 'plot', 'farm_house'];
      const isPlotType = plotTypes.includes(property.property_type);
      
      if (isPlotType) {
        // For land/plot/farm_house: prioritize plot_area_sqyd
        if (property.plot_area_sqyd && parseFloat(String(property.plot_area_sqyd)) > 0) {
          value = parseFloat(String(property.plot_area_sqyd));
          label = 'sq yd';
        } else if (property.area_sqyd && parseFloat(String(property.area_sqyd)) > 0) {
          value = parseFloat(String(property.area_sqyd));
          label = 'sq yd';
        } else if (property.plot_area_sqft && parseFloat(String(property.plot_area_sqft)) > 0) {
          // Convert sqft to sqyd for display
          value = parseFloat(String(property.plot_area_sqft)) / 9;
          label = 'sq yd';
        } else if (property.area_sqft && parseFloat(String(property.area_sqft)) > 0) {
          // Convert sqft to sqyd for display
          value = parseFloat(String(property.area_sqft)) / 9;
          label = 'sq yd';
        }
      } else {
        // For villa/independent_house: use sqft
        if (property.plot_area_sqft && parseFloat(String(property.plot_area_sqft)) > 0) {
          value = parseFloat(String(property.plot_area_sqft));
          label = 'sq ft';
        } else if (property.area_sqft && parseFloat(String(property.area_sqft)) > 0) {
          value = parseFloat(String(property.area_sqft));
          label = 'sq ft';
        } else if (property.plot_area_sqyd && parseFloat(String(property.plot_area_sqyd)) > 0) {
          // Convert sqyd to sqft for display
          value = parseFloat(String(property.plot_area_sqyd)) * 9;
          label = 'sq ft';
        }
      }
    } else if (areaType === 'builtup') {
      // Built-up area is typically in sqft
      if (property.built_up_area_sqft) {
        value = parseFloat(String(property.built_up_area_sqft));
        label = 'sq ft';
      }
    } else if (areaType === 'carpet') {
      // Carpet area is typically in sqft
      if (property.carpet_area_sqft) {
        value = parseFloat(String(property.carpet_area_sqft));
        label = 'sq ft';
      }
    } else {
      // Main area - for apartments default to sqft, for others use determined unit
      const apartmentTypes = ['standalone_apartment', 'gated_apartment', 'new_apartment'];
      if (apartmentTypes.includes(property.property_type)) {
        // For apartments, always show in sqft
        if (property.area_sqft && parseFloat(String(property.area_sqft)) > 0) {
          value = parseFloat(String(property.area_sqft));
          label = 'sq ft';
        }
      } else if (unit === 'sqyd' && property.area_sqyd) {
        value = parseFloat(String(property.area_sqyd));
        label = 'sq yd';
      } else if (unit === 'acres' && property.area_acres) {
        value = parseFloat(String(property.area_acres));
        label = 'acres';
      } else if (property.area_sqft) {
        value = parseFloat(String(property.area_sqft));
        label = 'sq ft';
      }
    }
    
    return {
      value,
      unit: label,
      display: value ? `${value.toLocaleString('en-IN')} ${label}` : 'N/A'
    };
  };

  // Helper function to get rate display matching the area unit
  const getRateDisplay = () => {
    if (!property || !property.price) return null;
    
    const unit = getAreaUnit();
    let rateValue: number | null = null;
    let rateUnit = '';
    
    if (unit === 'sqyd' && property.rate_per_sqyd) {
      rateValue = parseFloat(String(property.rate_per_sqyd));
      rateUnit = 'sq yd';
    } else if (unit === 'acres' && property.area_acres && property.rate_per_sqft) {
      // Calculate rate per acre from rate per sqft
      const ratePerSqft = parseFloat(String(property.rate_per_sqft));
      rateValue = ratePerSqft * 43560;
      rateUnit = 'acre';
    } else if (property.rate_per_sqft) {
      rateValue = parseFloat(String(property.rate_per_sqft));
      rateUnit = 'sq ft';
    }
    
    if (rateValue) {
      return {
        value: rateValue,
        unit: rateUnit,
        display: `Rate: ${formatIndianCurrency(rateValue)} per ${rateUnit}`
      };
    }
    
    return null;
  };

  // Helper function to get property type display name
  const getPropertyTypeDisplay = (propertyType: string) => {
    const typeMap: { [key: string]: string } = {
      'standalone_apartment': 'Standalone Apartment',
      'gated_apartment': 'Gated Community Apartment',
      'new_apartment': 'New Apartment',
      'new_property': 'New Property',
      'independent_house': 'Independent House',
      'villa': 'Villa',
      'commercial': 'Commercial Property',
      'land': 'Land/Plot',
      'farm_house': 'Farm House',
      'plot': 'Plot/Land',
      'lot': 'Lot'
    };
    return typeMap[propertyType] || propertyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to render property-specific details
  const renderPropertySpecificDetails = () => {
    if (!property) return null;

    const { property_type } = property;

    switch (property_type) {
      case 'standalone_apartment':
      case 'gated_apartment':
        return (
          <>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Bedrooms</span>
              <span className="font-medium text-[#162e5a]">{property.bedrooms}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Bathrooms</span>
              <span className="font-medium text-[#162e5a]">{property.bathrooms}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Floor</span>
              <span className="font-medium text-[#162e5a]">{property.floor || 'Ground Floor'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Total Floors</span>
              <span className="font-medium text-[#162e5a]">{property.total_floors || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Furnishing</span>
              <span className="font-medium text-[#162e5a]">{property.furnishing_status || 'Not Specified'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Parking</span>
              <span className="font-medium text-[#162e5a]">{property.parking_available ? 'Available' : 'Not Available'}</span>
            </div>
          </>
        );

      case 'independent_house':
      case 'villa':
        return (
          <>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Bedrooms</span>
              <span className="font-medium text-[#162e5a]">{property.bedrooms}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Bathrooms</span>
              <span className="font-medium text-[#162e5a]">{property.bathrooms}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Plot Area</span>
              <span className="font-medium text-[#162e5a]">{getAreaDisplay('plot').display}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Built-up Area</span>
              <span className="font-medium text-[#162e5a]">{getAreaDisplay('builtup').display}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Floors</span>
              <span className="font-medium text-[#162e5a]">{property.total_floors || '1'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Property Facing</span>
              <span className="font-medium text-[#162e5a]">{property.facing || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Furnishing</span>
              <span className="font-medium text-[#162e5a]">{property.furnishing_status || 'Not Specified'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Parking</span>
              <span className="font-medium text-[#162e5a]">{property.parking_available ? 'Available' : 'Not Available'}</span>
            </div>
          </>
        );

      case 'farm_house':
        return (
          <>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Plot Area</span>
              <span className="font-medium text-[#162e5a]">{getAreaDisplay('plot').display}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Soil Type</span>
              <span className="font-medium text-[#162e5a]">{property.soil_type || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Road Access</span>
              <span className="font-medium text-[#162e5a]">{property.road_access ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Corner Plot</span>
              <span className="font-medium text-[#162e5a]">{property.corner_plot ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Electricity</span>
              <span className="font-medium text-[#162e5a]">{property.electricity_available ? 'Available' : 'Not Available'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Water Source</span>
              <span className="font-medium text-[#162e5a]">{property.water_source || 'N/A'}</span>
            </div>
          </>
        );

      case 'commercial':
        return (
          <>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Floor</span>
              <span className="font-medium text-[#162e5a]">{property.floor || 'Ground Floor'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Total Floors</span>
              <span className="font-medium text-[#162e5a]">{property.total_floors || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Parking Spaces</span>
              <span className="font-medium text-[#162e5a]">{property.parking_spaces || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Washrooms</span>
              <span className="font-medium text-[#162e5a]">{property.washrooms || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Lift Available</span>
              <span className="font-medium text-[#162e5a]">{property.lift_available ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Power Backup</span>
              <span className="font-medium text-[#162e5a]">{property.power_backup ? 'Available' : 'Not Available'}</span>
            </div>
          </>
        );

      case 'land':
      case 'plot':
        return (
          <>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Plot Area</span>
              <span className="font-medium text-[#162e5a]">{getAreaDisplay('plot').display}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Soil Type</span>
              <span className="font-medium text-[#162e5a]">{property.soil_type || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Road Access</span>
              <span className="font-medium text-[#162e5a]">{property.road_access ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Corner Plot</span>
              <span className="font-medium text-[#162e5a]">{property.corner_plot ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Electricity</span>
              <span className="font-medium text-[#162e5a]">{property.electricity_available ? 'Available' : 'Not Available'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Water Source</span>
              <span className="font-medium text-[#162e5a]">{property.water_source || 'N/A'}</span>
            </div>
          </>
        );

      case 'new_apartment':
      case 'new_property':
        return (
          <>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Total Floors</span>
              <span className="font-medium text-[#162e5a]">{property.total_floors || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Parking</span>
              <span className="font-medium text-[#162e5a]">{property.parking_available ? 'Available' : 'Not Available'}</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-3">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Note:</strong> These properties are sold by sqft. Buyers can purchase any size (100, 200, 300+ sqft) at the rate shown.
              </p>
            </div>
          </>
        );

      case 'lot':
        return (
          <>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Road Access</span>
              <span className="font-medium text-[#162e5a]">{property.road_access ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Corner Plot</span>
              <span className="font-medium text-[#162e5a]">{property.corner_plot ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Electricity</span>
              <span className="font-medium text-[#162e5a]">{property.electricity_available ? 'Available' : 'Not Available'}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Water Source</span>
              <span className="font-medium text-[#162e5a]">{property.water_source || 'N/A'}</span>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-3">
              <p className="text-sm text-green-800">
                <strong>ℹ️ Note:</strong> Lots are sold by sq yard. Buyers can purchase any quantity (1, 2, 3... sq yards) at the rate shown.
              </p>
            </div>
          </>
        );

      default:
        return (
          <>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Property Size</span>
              <span className="font-medium text-[#162e5a]">{getAreaDisplay('main').display}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-600">Floor</span>
              <span className="font-medium text-[#162e5a]">{property.floor || 'Ground Floor'}</span>
            </div>
          </>
        );
    }
  };

  if (loading) {
    return (
      <div className="page-content min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-16 w-16 border-b-2 border-[#90C641] rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="page-content min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Not Found</h2>
            <button
              onClick={() => navigate('/')}
              className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35]"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-content min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-[100px]">
        <div className="bg-gradient-to-r from-[#f0f9ff] to-[#e0f2fe] py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center text-sm md:text-base text-[#162e5a] font-medium space-x-2">
              <Link
                to="/"
                className="hover:text-[#0ca5e9] transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Home
              </Link>
              <span className="text-[#0ca5e9]">›</span>
              <Link
                to="/buy"
                className="hover:text-[#0ca5e9] transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Properties
              </Link>
              <span className="text-[#0ca5e9]">›</span>
              <span className="text-[#162e5a] font-semibold truncate max-w-xs">
                {property.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => {
              navigate(-1);
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }}
            className="inline-flex items-center gap-2 text-[#162e5a] hover:text-[#0ca5e9] font-medium mb-4 transition-all"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#162e5a] mb-2 tracking-tight leading-tight">
              {property.title}
            </h1>
            <div className="flex items-center text-gray-600 text-sm md:text-base mb-2">
              <MapPin size={18} className="mr-2 text-[#0ca5e9]" />
              <span>{property.address}</span>
            </div>
            {property.custom_id && (
              <div className="flex items-center text-gray-600 text-sm mb-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Property ID: {property.custom_id}
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#0ca5e9]/10 text-[#0ca5e9]">
                {getPropertyTypeDisplay(property.property_type)}
              </span>
              {property.listing_type && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  property.listing_type === 'SALE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  For {property.listing_type}
                </span>
              )}
              {property.featured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  ⭐ Featured
                </span>
              )}
              {property.verified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('photos')}
                    className={`flex-1 py-3 px-4 md:px-6 font-semibold text-sm md:text-base transition-all duration-200
                      ${activeTab === 'photos'
                        ? 'bg-[#162e5a] text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-[#0ca5e9]/10 hover:text-[#0ca5e9]'
                      }`}
                  >
                    <Camera className="inline mr-2" size={16} />
                    Photos
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`flex-1 py-3 px-4 md:px-6 font-semibold text-sm md:text-base transition-all duration-200
                      ${activeTab === 'videos'
                        ? 'bg-[#162e5a] text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-[#0ca5e9]/10 hover:text-[#0ca5e9]'
                      }`}
                  >
                    <Video className="inline mr-2" size={16} />
                    View More
                  </button>
                </div>

                {/* Image/Video Display */}
                <div className="relative h-48 md:h-64 lg:h-80 xl:h-96 bg-gray-100">
                  {activeTab === 'photos' ? (
                    <>
                      <img
                        src={property.images[currentImageIndex]}
                        alt={property.title}
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                      {property.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 text-[#162e5a] hover:bg-white p-2 rounded-full shadow-md transition-all"
                          >
                            <ChevronLeft size={20} className="md:w-6 md:h-6" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 text-[#162e5a] hover:bg-white p-2 rounded-full shadow-md transition-all"
                          >
                            <ChevronRight size={20} className="md:w-6 md:h-6" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 text-[#162e5a] px-3 py-1 rounded-full text-xs font-medium shadow">
                            {currentImageIndex + 1} / {property.images.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <Video size={32} className="md:w-12 md:h-12 mx-auto mb-2 text-[#0ca5e9]" />
                        <p className="text-gray-500 text-sm md:text-base">Video content coming soon</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                <h3 className="text-xl font-semibold text-[#162e5a] mb-4 border-b border-gray-200 pb-2">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {/* Assigned Agent Details */}
              {property.assigned_agent && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4">Contact Assigned Agent</h3>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-200 rounded-full">
                      <User className="w-8 h-8 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-900">{property.assigned_agent.first_name} {property.assigned_agent.last_name}</p>
                      {property.assigned_agent.email && (
                        <p className="text-gray-600 flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4" />
                          {property.assigned_agent.email}
                        </p>
                      )}
                      {property.assigned_agent.phone_number && (
                        <p className="text-gray-600 flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4" />
                          {property.assigned_agent.phone_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Flexible Sections (amenities/nearby or custom) */}
              {property.sections && property.sections.length > 0 ? (
                <div className="space-y-6">
                  {(property.sections || []).map((section: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                      <h3 className="text-xl font-semibold text-[#162e5a] mb-4">{section.title}</h3>
                      <div className="prose max-w-full text-gray-700">
                        {/* If content looks like a link to PDF, embed; otherwise render text preserving line breaks */}
                        {typeof section.content === 'string' && section.content.trim().toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-[600px]">
                            <iframe src={section.content} title={section.title} className="w-full h-full border rounded" />
                          </div>
                        ) : (
                          <p className="whitespace-pre-line">{section.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amenities */}
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                    <h3 className="text-xl font-semibold text-[#162e5a] mb-4">Amenities & Features</h3>
                    <div className="space-y-4">
                      {property.property_type === 'land' || property.property_type === 'plot' ? (
                        // Land/Plot specific amenities
                        <>
                          {property.electricity_available && (
                            <div className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all">
                              <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <Zap size={16} />
                              </div>
                              <span className="text-gray-700 text-base">Electricity Available</span>
                            </div>
                          )}
                          {property.water_source && (
                            <div className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all">
                              <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <Waves size={16} />
                              </div>
                              <span className="text-gray-700 text-base">Water Source: {property.water_source}</span>
                            </div>
                          )}
                          {property.road_access && (
                            <div className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all">
                              <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <HomeIcon size={16} />
                              </div>
                              <span className="text-gray-700 text-base">Road Access</span>
                            </div>
                          )}
                        </>
                      ) : property.property_type === 'commercial' ? (
                        // Commercial property amenities
                        <>
                          {property.lift_available && (
                            <div className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all">
                              <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <HomeIcon size={16} />
                              </div>
                              <span className="text-gray-700 text-base">Lift Available</span>
                            </div>
                          )}
                          {property.power_backup && (
                            <div className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all">
                              <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <Zap size={16} />
                              </div>
                              <span className="text-gray-700 text-base">Power Backup</span>
                            </div>
                          )}
                          {property.parking_spaces && (
                            <div className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all">
                              <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <Car size={16} />
                              </div>
                              <span className="text-gray-700 text-base">Parking: {property.parking_spaces} spaces</span>
                            </div>
                          )}
                        </>
                      ) : (
                        // Residential property amenities (apartments, houses, villas)
                        property.amenities && property.amenities.length > 0 ? (
                          (property.amenities || []).map((amenity: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all"
                            >
                              <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                                {amenity.icon}
                              </div>
                              <span className="text-gray-700 text-base">{amenity.name}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all">
                              <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <Zap size={16} />
                              </div>
                              <span className="text-gray-700 text-base">Power Backup</span>
                            </div>
                            <div className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all">
                              <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <Shield size={16} />
                              </div>
                              <span className="text-gray-700 text-base">24/7 Security</span>
                            </div>
                            <div className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all">
                              <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <Car size={16} />
                              </div>
                              <span className="text-gray-700 text-base">Parking</span>
                            </div>
                          </>
                        )
                      )}
                    </div>
                  </div>

                  {/* Nearby Highlights */}
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                    <h3 className="text-xl font-semibold text-[#162e5a] mb-4">Nearby Highlights</h3>
                    <div className="space-y-4">
                      {(property.nearbyHighlights || []).map((highlight: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-all"
                        >
                          <div className="w-9 h-9 bg-[#0ca5e9]/10 text-[#0ca5e9] rounded-full flex items-center justify-center mr-3 shadow-sm">
                            {highlight.icon}
                          </div>
                          <span className="text-gray-700 text-base">{highlight.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Map */}
              {mapCoordinates && (
                <div className="bg-white rounded-lg p-4 md:p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-[#3B5998] mb-4">Location</h3>
                  {mapLoading ? (
                    <div className="h-48 md:h-64 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading map location...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 md:h-64 rounded-lg overflow-hidden">
                      <MapContainer
                        center={[mapCoordinates.lat, mapCoordinates.lng]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        key={`${mapCoordinates.lat}-${mapCoordinates.lng}`}
                      >
                        <TileLayer 
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[mapCoordinates.lat, mapCoordinates.lng]}>
                          <Popup>
                            <div>
                              <strong>{property.title || 'Property Location'}</strong>
                              {property.address && (
                                <div className="text-sm mt-1">{property.address}</div>
                              )}
                              {(property.zip_code || property.pincode) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Pincode: {property.zip_code || property.pincode}
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    📍 {property.address || property.city || 'Location'} 
                    {property.zip_code && ` - ${property.zip_code}`}
                    {property.pincode && !property.zip_code && ` - ${property.pincode}`}
                    {!property.address && !property.city && ` (${mapCoordinates.lat.toFixed(6)}, ${mapCoordinates.lng.toFixed(6)})`}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Property Details */}
            <div className="space-y-6">
              {/* Property Details Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                {/* Title with background */}
                <div className="bg-[#0ca5e9] text-white text-center py-3 rounded-xl mb-6 shadow-sm">
                  <h3 className="text-xl font-bold tracking-wide">Property Details</h3>
                </div>

                {/* Property Type Badge */}
                <div className="mb-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#0ca5e9]/10 text-[#0ca5e9]">
                    {getPropertyTypeDisplay(property.property_type)}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Property Type</span>
                    <span className="font-medium text-[#162e5a]">
                      {getPropertyTypeDisplay(property.property_type)}
                    </span>
                  </div>

                  {/* Property-specific details */}
                  {renderPropertySpecificDetails()}

                  {property.rera_id && (
                    <div className="flex justify-between text-sm md:text-base">
                      <span className="text-gray-600">Rera ID</span>
                      <span className="font-medium text-[#162e5a]">{property.rera_id}</span>
                    </div>
                  )}

                  {property.listing_type === 'RENT' && property.available_from && (
                    <div className="flex justify-between text-sm md:text-base">
                      <span className="text-gray-600">Available From</span>
                      <span className="font-medium text-[#162e5a]">
                        {new Date(property.available_from).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {property.featured && (
                    <div className="flex justify-between text-sm md:text-base">
                      <span className="text-gray-600">Featured</span>
                      <span className="font-medium text-green-600">✓ Yes</span>
                    </div>
                  )}

                  {property.verified && (
                    <div className="flex justify-between text-sm md:text-base">
                      <span className="text-gray-600">Verified</span>
                      <span className="font-medium text-green-600">✓ Yes</span>
                    </div>
                  )}
                </div>

                {/* Price Display */}
                <div className="mt-6 p-4 bg-[#f4f9ff] rounded-xl shadow-inner">
                  <div className="text-center">
                    {/* Use formatted_pricing if available (for new_apartment, new_property, lot) */}
                    {property.formatted_pricing?.display_text ? (
                      <>
                        <p className="text-2xl font-bold text-[#0ca5e9]">
                          {property.formatted_pricing.display_text}
                        </p>
                        {property.formatted_pricing.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {property.formatted_pricing.description}
                          </p>
                        )}
                        {/* Show examples for lot type */}
                        {property.formatted_pricing.examples && property.formatted_pricing.examples.length > 0 && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                            <p className="text-xs font-semibold text-blue-800 mb-2">Examples:</p>
                            <div className="space-y-1">
                              {property.formatted_pricing.examples.map((example: any, idx: number) => (
                                <p key={idx} className="text-xs text-gray-700">
                                  {example.display}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-[#0ca5e9]">
                          {property.listing_type === 'SALE'
                            ? formatIndianCurrency(property.price || 0)
                            : `${formatIndianCurrency(property.monthly_rent || 0)}/month`}
                        </p>
                        {property.listing_type === 'SALE' && (property.property_type === 'land' || property.property_type === 'plot') && (
                          <div className="mt-2 space-y-1">
                            {(() => {
                              const rateInfo = getRateDisplay();
                              return rateInfo ? (
                                <p className="text-sm text-gray-600">
                                  {rateInfo.display}
                                </p>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </>
                    )}
                    {property.listing_type === 'RENT' && property.security_deposit && (
                      <p className="text-sm text-gray-600 mt-1">
                        Security Deposit: {formatIndianCurrency(property.security_deposit)}
                      </p>
                    )}
                    {property.listing_type === 'RENT' && property.maintenance_charges && (
                      <p className="text-sm text-gray-600 mt-1">
                        Maintenance: {formatIndianCurrency(property.maintenance_charges)}/month
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <PropertyActionButtons
                  property={property}
                  onInquiry={handleQuickInquiry}
                  onBooking={() => {
                    console.log('[PropertyDetails] Opening tour modal');
                    setShowTourModal(true);
                  }}
                  inquiryLoading={inquiryLoading}
                />

                {/* Agent Information */}
                {agentInfo && (
                  <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-[#162e5a] mb-4">Contact Agent</h3>
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-200 rounded-full">
                        <User className="w-8 h-8 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg text-gray-900">
                          {agentInfo.first_name} {agentInfo.last_name}
                        </p>
                        {agentInfo.email && (
                          <p className="text-gray-600 flex items-center gap-2 mt-2">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${agentInfo.email}`} className="hover:text-blue-600">
                              {agentInfo.email}
                            </a>
                          </p>
                        )}
                        {agentInfo.phone_number && (
                          <p className="text-gray-600 flex items-center gap-2 mt-2">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${agentInfo.phone_number}`} className="hover:text-blue-600">
                              {agentInfo.phone_number}
                            </a>
                          </p>
                        )}
                        {agentInfo.city && (
                          <p className="text-gray-600 flex items-center gap-2 mt-2">
                            <MapPin className="w-4 h-4" />
                            {agentInfo.city}{agentInfo.state && `, ${agentInfo.state}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Highlights */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-[#162e5a] mb-4">Property Highlights</h3>
                <div className="grid grid-cols-1 gap-3">
                  {property.property_type === 'standalone_apartment' || property.property_type === 'gated_apartment' || property.property_type === 'new_apartment' ? (
                    <>
                      {property.property_type !== 'new_apartment' && property.bedrooms && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Configuration</span>
                          <span className="font-medium text-[#162e5a]">{property.bedrooms} BHK</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Floor</span>
                        <span className="font-medium text-[#162e5a]">{property.floor || 'Ground'} of {property.total_floors || 'N/A'}</span>
                      </div>
                      {property.property_type !== 'new_apartment' && property.property_type !== 'new_property' && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Area</span>
                          <span className="font-medium text-[#162e5a]">{getAreaDisplay('main').display}</span>
                        </div>
                      )}
                      {(property.property_type === 'new_apartment' || property.property_type === 'new_property') && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                          <p className="text-xs text-blue-800">
                            Properties are sold by sqft. Buyers can purchase any size at the rate shown.
                          </p>
                        </div>
                      )}
                    </>
                  ) : property.property_type === 'independent_house' || property.property_type === 'villa' || property.property_type === 'farm_house' ? (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Configuration</span>
                        <span className="font-medium text-[#162e5a]">{property.bedrooms} BHK</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Plot Area</span>
                        <span className="font-medium text-[#162e5a]">{getAreaDisplay('plot').display}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Built-up Area</span>
                        <span className="font-medium text-[#162e5a]">{getAreaDisplay('builtup').display}</span>
                      </div>
                    </>
                  ) : property.property_type === 'commercial' ? (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Floor</span>
                        <span className="font-medium text-[#162e5a]">{property.floor || 'Ground'} of {property.total_floors || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Area</span>
                        <span className="font-medium text-[#162e5a]">{getAreaDisplay('main').display}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Parking</span>
                        <span className="font-medium text-[#162e5a]">{property.parking_spaces || 'N/A'} spaces</span>
                      </div>
                    </>
                  ) : (property.property_type === 'land' || property.property_type === 'plot' || property.property_type === 'farm_house') ? (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Plot Area</span>
                        <span className="font-medium text-[#162e5a]">{getAreaDisplay('plot').display}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Dimensions</span>
                        <span className="font-medium text-[#162e5a]">{property.plot_dimensions || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Road Access</span>
                        <span className="font-medium text-[#162e5a]">{property.road_access ? 'Yes' : 'No'}</span>
                      </div>
                    </>
                  ) : property.property_type === 'lot' ? (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Road Access</span>
                        <span className="font-medium text-[#162e5a]">{property.road_access ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Electricity</span>
                        <span className="font-medium text-[#162e5a]">{property.electricity_available ? 'Available' : 'Not Available'}</span>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-2">
                        <p className="text-xs text-green-800">
                          Lots are sold by sq yard. Buyers can purchase any quantity (1, 2, 3... sq yards) at the rate shown.
                        </p>
                      </div>
                    </>
                  ) : property.property_type === 'new_property' ? (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Total Floors</span>
                        <span className="font-medium text-[#162e5a]">{property.total_floors || 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                        <p className="text-xs text-blue-800">
                          Properties are sold by sqft. Buyers can purchase any size at the rate shown.
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <TourBookingModal
        isOpen={showTourModal}
        onClose={() => {
          console.log('[PropertyDetails] Closing tour modal');
          setShowTourModal(false);
        }}
        property={property}
      />
    </div>
  );
};

export default PropertyDetails;