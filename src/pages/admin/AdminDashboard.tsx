import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseUser as User, Property, Booking, Inquiry } from '@/types/database';
import { getStatusBadge, formatCurrency, getUserTypeColor } from '@/utils/adminHelpers';
import { useAdminData } from '@/hooks/useAdminData';
import { AdminApi } from '@/services/pyApi';
import toast from 'react-hot-toast';

import ViewUserModal from '@/components/admin/ViewUserModal';
import ViewPropertyModal from '@/components/admin/ViewPropertyModal';
import ViewBookingModal from '@/components/admin/ViewBookingModal';
import ViewInquiryModal from '@/components/admin/ViewInquiryModal';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import EditPropertyModal from '@/components/admin/EditPropertyModal';
import AssignAgentModal from '@/components/admin/AssignAgentModal';
import DashboardOverview from '@/components/admin/DashboardOverview';
import CommissionManagement from '@/components/admin/CommissionManagement';
import EnhancedDashboard from '@/components/admin/EnhancedDashboard';
import PropertyAssignmentManager from '@/components/admin/PropertyAssignmentManager';
import AdminTable from '@/components/admin/AdminTable';
import AddUserModal from '@/components/admin/AddUserModal';
import AddPropertyModal from '@/components/admin/AddPropertyModal';
import AddBookingModal from '@/components/admin/AddBookingModal';
import EditUserModal from '@/components/admin/EditUserModal';
import EditBookingModal from '@/components/admin/EditBookingModal';
import CitiesManagement from './cities-states/CitiesManagement';
import StatesManagement from './cities-states/StatesManagement';
import UserApprovalsTab from '@/components/admin/UserApprovalsTab';
import PropertyApprovalsTab from '@/components/admin/PropertyApprovalsTab';
import AdminApprovalsTab from '@/components/admin/AdminApprovalsTab';
import RoleManagementTab from '@/components/admin/RoleManagementTab';
import AgentManagement from '@/components/admin/AgentManagement';
import CommissionTracking from '@/components/admin/CommissionTracking';
import CommissionOverview from '@/components/admin/CommissionOverview';
import CommissionPayments from '@/components/admin/CommissionPayments';
import AgentEarnings from '@/components/admin/AgentEarnings';
import UnassignedPropertiesManagement from '@/components/admin/UnassignedPropertiesManagement';
import NotificationsPage from './NotificationsPage';
import AdvancedAnalyticsDashboard from '@/components/admin/AdvancedAnalyticsDashboard';

const AdminDashboard: React.FC = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Use the custom hook for data fetching
  const {
    stats,
    users,
    properties,
    bookings,
    inquiries,
    isRefreshing,
    loading,
    fetchAllData,
  fetchUsers,
  fetchProperties,
  fetchBookings,
  fetchInquiries,
  handleDeleteUser,
  handleDeleteProperty
  } = useAdminData();

  // State for tracking which sections have been loaded
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set(['dashboard']));

  // Function to load data for a specific section
  const loadSectionData = async (section: string) => {
    if (loadedSections.has(section)) return; // Already loaded
    
    try {
      switch (section) {
        case 'users':
          await fetchUsers();
          break;
        case 'properties':
          await fetchProperties();
          break;
        case 'bookings':
          await fetchBookings();
          break;
        case 'inquiries':
          await fetchInquiries();
          break;
        default:
          return;
      }
      setLoadedSections(prev => new Set([...prev, section]));
    } catch (error) {
      console.error(`Error loading ${section} data:`, error);
      toast.error(`Failed to load ${section} data`);
    }
  };

  // State management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [showViewPropertyModal, setShowViewPropertyModal] = useState(false);
  const [showViewBookingModal, setShowViewBookingModal] = useState(false);
  const [showViewInquiryModal, setShowViewInquiryModal] = useState(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [showAssignAgentModal, setShowAssignAgentModal] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  // Removed unused local error state; route guard redirects to /admin/login

  // Add booking
  const handleAddBooking = async () => {
    setShowAddBookingModal(true);
  };

  // Edit booking
  const handleEditBooking = async (booking: Booking) => {
    setSelectedBooking(booking);
    setShowEditBookingModal(true);
  };

  // Delete booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    console.log('Deleting booking with ID:', bookingId);
    try {
      setIsDeleting(true);
      await AdminApi.deleteBooking(bookingId);
      toast.success('Booking deleted successfully');
      await fetchBookings();
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      toast.error(error.message || 'Failed to delete booking');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add inquiry
  const handleAddInquiry = async () => {
    // For now, redirect to inquiries page or show a message
    toast.success('Please use the property details page to create inquiries');
  };

  // Edit inquiry
  const handleEditInquiry = async (inquiry: Inquiry) => {
    // For now, just view the inquiry
    handleViewInquiry(inquiry);
  };

  // Delete inquiry
  const handleDeleteInquiry = async (inquiryId: string) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;

    console.log('Deleting inquiry with ID:', inquiryId);
    try {
      setIsDeleting(true);
      await AdminApi.deleteInquiry(inquiryId);
      toast.success('Inquiry deleted successfully');
      await fetchInquiries();
    } catch (error: any) {
      console.error('Error deleting inquiry:', error);
      toast.error(error.message || 'Failed to delete inquiry');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add user
  const handleAddUser = async () => {
    setShowAddUserModal(true);
  };

  // Add property
  const handleAddProperty = async () => {
    setShowAddPropertyModal(true);
  };

  useEffect(() => {
    // While the AuthProvider is determining session status, do not redirect.
    if (authLoading) return;

    const userType = (user as any)?.user_type || '';

    // If there is no user or the user is not an admin, redirect to admin login.
    if (!user || String(userType).toLowerCase() !== 'admin') {
      navigate('/admin/login', { replace: true, state: { from: '/admin' } });
      return;
    }

    // Initial data fetch only after auth confirmed and user is admin
      // For first load, fetch dashboard statistics only to avoid fetching all lists
      fetchAllData();
  }, [user, authLoading, navigate]);

    // Fetch per-tab data only when the tab becomes active
    useEffect(() => {
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'properties') {
        fetchProperties();
      } else if (activeTab === 'bookings') {
        fetchBookings();
      } else if (activeTab === 'inquiries') {
        fetchInquiries();
      }
    }, [activeTab]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };
  
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewUserModal(true);
  };
  
  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowEditPropertyModal(true);
  };
  
  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowViewPropertyModal(true);
  };
  
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowViewBookingModal(true);
  };
  
  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowViewInquiryModal(true);
  };

  const handleAssignAgent = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setSelectedInquiryId(inquiry.id);
    setShowAssignAgentModal(true);
  };

  const handleCardClick = async (cardType: string) => {
    await loadSectionData(cardType);
    setActiveTab(cardType);
  };

  const handleTabChange = async (tab: string) => {
    await loadSectionData(tab);
    setActiveTab(tab);
  };

  const renderContent = () => {
    // Define columns outside switch to avoid temporal dead zone
    const bookingColumns = [
      { key: 'booking_date', header: 'Date', render: (booking: Booking) => new Date(booking.booking_date).toLocaleDateString() },
      { key: 'booking_time', header: 'Time' },
      { key: 'property_title', header: 'Property' },
      { key: 'customer_name', header: 'Customer' },
      { key: 'agent_name', header: 'Agent' },
      { key: 'status', header: 'Status', render: (booking: Booking) => getStatusBadge(booking.status || 'pending') }
    ];
    
    const propertyColumns = [
      { key: 'custom_id', header: 'ID' },
      { key: 'title', header: 'Title' },
      { key: 'owner_name', header: 'Owner' },
      { key: 'agent_name', header: 'Agent' },
      { key: 'property_type', header: 'Type', render: (property: Property) => {
        const typeLabels = {
          'standalone_apartment': 'Standalone Apt',
          'gated_apartment': 'Gated Apt',
          'independent_house': 'Independent House',
          'villa': 'Villa',
          'commercial': 'Commercial',
          'land': 'Land',
          'plot': 'Plot',
          'farm_house': 'Farm House'
        };
        return typeLabels[property.property_type as keyof typeof typeLabels] || property.property_type;
      }},
      { key: 'listing_type', header: 'Listing', render: (property: Property) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          property.listing_type === 'SALE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {property.listing_type === 'SALE' ? 'For Sale' : 'For Rent'}
        </span>
      )},
      { key: 'price', header: 'Price', render: (property: Property) => 
        property.listing_type === 'SALE' ? formatCurrency(property.price ?? null) : formatCurrency(property.monthly_rent ?? null) + '/month'
      },
      { key: 'area', header: 'Area', render: (property: Property) => {
        if (property.area_sqft) return `${property.area_sqft} sqft`;
        if (property.plot_area_sqft) return `${property.plot_area_sqft} sqft`;
        return 'N/A';
      }},
      { key: 'bedrooms', header: 'Beds', render: (property: Property) => property.bedrooms || 'N/A' },
      { key: 'bathrooms', header: 'Baths', render: (property: Property) => property.bathrooms || 'N/A' },
      { key: 'city', header: 'Location', render: (property: Property) => {
        const location = [property.city, property.state].filter(Boolean).join(', ');
        return location || 'N/A';
      }},
      { key: 'status', header: 'Status', render: (property: Property) => getStatusBadge(property.status || 'pending') },
      { key: 'featured', header: 'Featured', render: (property: Property) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          property.featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {property.featured ? 'Yes' : 'No'}
        </span>
      )}
    ];

    console.log(`Rendering content for tab: ${activeTab}`);

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            stats={stats}
            onCardClick={handleCardClick}
            users={users}
            properties={properties}
            bookings={bookings}
            inquiries={inquiries}
            onAddUser={handleAddUser}
            onAddProperty={handleAddProperty}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onViewProperty={handleViewProperty}
            onEditProperty={handleEditProperty}
            onDeleteProperty={handleDeleteProperty}
            onViewBooking={handleViewBooking}
            onEditBooking={handleEditBooking}
            onDeleteBooking={handleDeleteBooking}
            onViewInquiry={handleViewInquiry}
            onAssignAgent={handleAssignAgent}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'users':
        const userColumns = [
          { key: 'custom_id', header: 'ID' },
          { key: 'first_name', header: 'Name', render: (user: User) => `${user.first_name} ${user.last_name}` },
          { key: 'email', header: 'Email' },
          { key: 'user_type', header: 'Type', render: (user: User) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
              {user.user_type}
            </span>
          )},
          { key: 'status', header: 'Status', render: (user: User) => {
              // If user is verified but status is pending, show as active
              // This handles cases where verification_status is updated but status wasn't
              const effectiveStatus = (user.verification_status === 'verified' && (user.status === 'pending' || !user.status)) 
                ? 'active' 
                : (user.status || 'pending');
              return getStatusBadge(effectiveStatus);
            }
          },
          { key: 'verification_status', header: 'Verification', render: (user: User) => getStatusBadge(user.verification_status) }
        ];
        return (
          <AdminTable
            data={users}
            columns={userColumns}
            title="Users"
            onAdd={handleAddUser}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'agents':
        const agentUsers = users.filter(user => user.user_type === 'agent');
        const agentColumns = [
          { key: 'custom_id', header: 'ID' },
          { key: 'first_name', header: 'Name', render: (user: User) => `${user.first_name} ${user.last_name}` },
          { key: 'email', header: 'Email' },
          { key: 'email_verified', header: 'Email Verified', render: (user: User) => {
            const verified = Boolean(user?.email_verified);
            return (
              <span aria-label={`Email verified: ${verified ? 'Yes' : 'No'}`} className={`px-2 py-1 rounded-full text-xs font-medium ${verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {verified ? 'Yes' : 'No'}
              </span>
            );
          }},
          { key: 'phone_number', header: 'Phone' },
          { key: 'agent_license_number', header: 'License Number', render: (user: User) => user.agent_license_number || 'Pending Verification' },
          { key: 'documents', header: 'Documents', render: (user: User) => (
            <span className="text-sm text-gray-700">{(user.documents || []).length || 0}</span>
          )},
          { key: 'status', header: 'Status', render: (user: User) => {
              // If user is verified but status is pending, show as active
              // This handles cases where verification_status is updated but status wasn't
              const effectiveStatus = (user.verification_status === 'verified' && (user.status === 'pending' || !user.status)) 
                ? 'active' 
                : (user.status || 'pending');
              return getStatusBadge(effectiveStatus);
            }
          },
          { key: 'verification_status', header: 'Verification', render: (user: User) => getStatusBadge(user.verification_status) }
        ];
        return (
          <AdminTable
            data={agentUsers}
            columns={agentColumns}
            onView={handleViewUser}
            title="Agents"
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'buyers':
        const buyerUsers = users.filter(user => user.user_type === 'buyer');
        const buyerColumns = [
          { key: 'custom_id', header: 'ID' },
          { key: 'first_name', header: 'Name', render: (user: User) => `${user.first_name} ${user.last_name}` },
          { key: 'email', header: 'Email' },
          { key: 'email_verified', header: 'Email Verified', render: (user: User) => {
            const verified = Boolean(user?.email_verified);
            return (
              <span aria-label={`Email verified: ${verified ? 'Yes' : 'No'}`} className={`px-2 py-1 rounded-full text-xs font-medium ${verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {verified ? 'Yes' : 'No'}
              </span>
            );
          }},
          { key: 'phone_number', header: 'Phone' },
          { key: 'documents', header: 'Documents', render: (user: User) => (
            <span className="text-sm text-gray-700">{(user.documents || []).length || 0}</span>
          )},
          { key: 'status', header: 'Status', render: (user: User) => {
              // If user is verified but status is pending, show as active
              // This handles cases where verification_status is updated but status wasn't
              const effectiveStatus = (user.verification_status === 'verified' && (user.status === 'pending' || !user.status)) 
                ? 'active' 
                : (user.status || 'pending');
              return getStatusBadge(effectiveStatus);
            }
          },
          { key: 'verification_status', header: 'Verification', render: (user: User) => getStatusBadge(user.verification_status) }
        ];
        return (
          <AdminTable
            data={buyerUsers}
            columns={buyerColumns}
            onView={handleViewUser}
            title="Buyers"
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'sellers':
        const sellerUsers = users.filter(user => user.user_type === 'seller' || user.user_type === 'owner');
        const sellerColumns = [
          { key: 'custom_id', header: 'ID' },
          { key: 'first_name', header: 'Name', render: (user: User) => `${user.first_name} ${user.last_name}` },
          { key: 'email', header: 'Email' },
          { key: 'email_verified', header: 'Email Verified', render: (user: User) => {
            const verified = Boolean(user?.email_verified);
            return (
              <span aria-label={`Email verified: ${verified ? 'Yes' : 'No'}`} className={`px-2 py-1 rounded-full text-xs font-medium ${verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {verified ? 'Yes' : 'No'}
              </span>
            );
          }},
          { key: 'phone_number', header: 'Phone' },
          { key: 'documents', header: 'Documents', render: (user: User) => (
            <span className="text-sm text-gray-700">{(user.documents || []).length || 0}</span>
          )},
          { key: 'status', header: 'Status', render: (user: User) => {
              // If user is verified but status is pending, show as active
              // This handles cases where verification_status is updated but status wasn't
              const effectiveStatus = (user.verification_status === 'verified' && (user.status === 'pending' || !user.status)) 
                ? 'active' 
                : (user.status || 'pending');
              return getStatusBadge(effectiveStatus);
            }
          },
          { key: 'verification_status', header: 'Verification', render: (user: User) => getStatusBadge(user.verification_status) }
        ];
        return (
          <AdminTable
            data={sellerUsers}
            columns={sellerColumns}
            onView={handleViewUser}
            title="Sellers"
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'properties':
        return (
          <AdminTable
            data={properties}
            columns={propertyColumns}
            title="Properties"
            onEdit={handleEditProperty}
            onView={handleViewProperty}
            onAdd={handleAddProperty}
            onDelete={handleDeleteProperty}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'properties-sale':
        const saleProperties = properties.filter(p => p.listing_type === 'SALE');
        return (
          <AdminTable
            data={saleProperties}
            columns={propertyColumns}
            onEdit={handleEditProperty}
            onView={handleViewProperty}
            title="Properties for Sale"
            onAdd={handleAddProperty}
            onDelete={handleDeleteProperty}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'apartments':
        const apartmentProperties = properties.filter(p => 
          p.property_type === 'standalone_apartment' || p.property_type === 'gated_apartment'
        );
        return (
          <AdminTable
            data={apartmentProperties}
            columns={propertyColumns}
            onEdit={handleEditProperty}
            onView={handleViewProperty}
            title="Apartments"
            onAdd={handleAddProperty}
            onDelete={handleDeleteProperty}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'houses':
        const houseProperties = properties.filter(p => 
          p.property_type === 'independent_house' || p.property_type === 'villa' || p.property_type === 'farm_house'
        );
        return (
          <AdminTable
            data={houseProperties}
            columns={propertyColumns}
            onEdit={handleEditProperty}
            onView={handleViewProperty}
            title="Houses & Villas"
            onAdd={handleAddProperty}
            onDelete={handleDeleteProperty}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'commercial':
        const commercialProperties = properties.filter(p => p.property_type === 'commercial');
        return (
          <AdminTable
            data={commercialProperties}
            columns={propertyColumns}
            onEdit={handleEditProperty}
            onView={handleViewProperty}
            title="Commercial Properties"
            onAdd={handleAddProperty}
            onDelete={handleDeleteProperty}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'land':
        const landProperties = properties.filter(p => 
          p.property_type === 'land' || p.property_type === 'plot'
        );
        return (
          <AdminTable
            data={landProperties}
            columns={propertyColumns}
            onEdit={handleEditProperty}
            onView={handleViewProperty}
            title="Land & Plots"
            onAdd={handleAddProperty}
            onDelete={handleDeleteProperty}
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'pending-tours':
        const pendingBookings = bookings.filter(b => b.status === 'pending');
        return (
          <AdminTable
            data={pendingBookings}
            columns={bookingColumns}
            onAdd={handleAddBooking}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
            onView={handleViewBooking}
            title="Pending Tours"
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'confirmed-tours':
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        return (
          <AdminTable
            data={confirmedBookings}
            columns={bookingColumns}
            onAdd={handleAddBooking}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
            onView={handleViewBooking}
            title="Confirmed Tours"
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'completed-tours':
        const completedBookings = bookings.filter(b => b.status === 'completed');
        return (
          <AdminTable
            data={completedBookings}
            columns={bookingColumns}
            onAdd={handleAddBooking}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
            onView={handleViewBooking}
            title="Completed Tours"
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'bookings':
        return <AdminTable data={bookings} columns={bookingColumns} title="Bookings" onAdd={handleAddBooking} onRefresh={fetchBookings} onView={handleViewBooking} onEdit={handleEditBooking} onDelete={handleDeleteBooking} />;

      case 'inquiries':
        const inquiryColumns = [
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Phone' },
          { key: 'property', header: 'Property', render: (inquiry: Inquiry) => {
              const property = properties.find(p => p.id === inquiry.property_id);
              return property ? property.title : 'N/A';
            }
          },
          { key: 'agent', header: 'Assigned Agent', render: (inquiry: Inquiry) => {
              const property = properties.find(p => p.id === inquiry.property_id);
              if (property && property.agent_id) {
                const agent = users.find(u => u.id === property.agent_id);
                return agent ? `${agent.first_name} ${agent.last_name}` : 'Unassigned';
              }
              return 'Unassigned';
            }
          },
          { key: 'message', header: 'Message', render: (inquiry: Inquiry) => 
            inquiry.message.length > 50 ? inquiry.message.substring(0, 50) + '...' : inquiry.message
          },
          { key: 'status', header: 'Status', render: (inquiry: Inquiry) => getStatusBadge(inquiry.status || 'new') }
        ];
        return (
          <AdminTable
            data={inquiries}
            columns={inquiryColumns}
            onAdd={handleAddInquiry}
            onEdit={handleEditInquiry}
            onDelete={handleDeleteInquiry}
            onAssignAgent={handleAssignAgent}
            onView={handleViewInquiry}
            title="Inquiries"
            onRefresh={() => fetchAllData(true)}
          />
        );

      case 'cities':
        return <CitiesManagement />;

      case 'states':
        return <StatesManagement />;

      case 'user-approvals':
        return <UserApprovalsTab />;

      case 'property-approvals':
        return <PropertyApprovalsTab />;

      case 'role-management':
        return <RoleManagementTab />;

      case 'admin-approvals':
        return <AdminApprovalsTab onRefresh={fetchAllData} />;

      case 'agent-approvals':
        return <AgentManagement onAgentUpdate={fetchAllData} />;

      case 'agent-assignments':
        return <PropertyAssignmentManager onRefresh={fetchAllData} />;

      case 'agent-performance':
        return <AgentManagement onAgentUpdate={fetchAllData} />;

      case 'unassigned-properties':
        return <UnassignedPropertiesManagement />;

      case 'commission-overview':
        return <CommissionOverview />;

      case 'commission-payments':
        return <CommissionPayments />;

      case 'agent-earnings':
        return <AgentEarnings />;

      case 'enhanced-dashboard':
        return <EnhancedDashboard onRefresh={fetchAllData} />;

      case 'advanced-analytics':
        return <AdvancedAnalyticsDashboard />;

      case 'analytics-overview':
        return <AdvancedAnalyticsDashboard />;

      case 'property-assignments':
        return <PropertyAssignmentManager onRefresh={fetchAllData} />;

      case 'notifications':
        return <NotificationsPage />;

      default:
        return (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Unauthenticated users are redirected to /admin/login

  return (
    <div className="min-h-screen bg-gray-100 flex relative">
      {/* Mobile Overlay */}
      {sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={() => setSidebarCollapsed(false)}
        />
      )}

      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        activeTab={activeTab}
        expandedMenus={expandedMenus}
        onTabChange={handleTabChange}
        onMenuToggle={toggleMenu}
      />

      {/* Global loading overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center">
            <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 rounded-full mr-3"></div>
            <p className="text-gray-800">Deleting...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          user={user}
          isRefreshing={isRefreshing}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSignOut={handleSignOut}
        />

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
          <div className="max-w-full">
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#3B5998] text-white text-center py-3 sm:py-4 no-print">
          <p className="text-xs sm:text-sm">© Home & Own 2025. All Rights Reserved</p>
        </footer>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={fetchAllData}
      />

      <AddPropertyModal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onPropertyAdded={fetchAllData}
      />

      <AddBookingModal
        isOpen={showAddBookingModal}
        onClose={() => setShowAddBookingModal(false)}
        onBookingAdded={fetchAllData}
      />

      <EditUserModal
        isOpen={showEditUserModal}
        onClose={() => {
          setShowEditUserModal(false);
          setSelectedUser(null);
        }}
        onUserUpdated={fetchAllData}
        user={selectedUser}
      />

      <EditBookingModal
        isOpen={showEditBookingModal}
        onClose={() => {
          setShowEditBookingModal(false);
          setSelectedBooking(null);
        }}
        onBookingUpdated={fetchAllData}
        booking={selectedBooking}
      />

      <ViewUserModal
        isOpen={showViewUserModal}
        onClose={() => {
          setShowViewUserModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
      
      <ViewPropertyModal
        isOpen={showViewPropertyModal}
        onClose={() => {
          setShowViewPropertyModal(false);
          setSelectedProperty(null);
        }}
        property={selectedProperty as Property}
      />
      
      <ViewBookingModal
        isOpen={showViewBookingModal}
        onClose={() => {
          setShowViewBookingModal(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking as Booking}
      />
      
      <ViewInquiryModal
        isOpen={showViewInquiryModal}
        onClose={() => {
          setShowViewInquiryModal(false);
          setSelectedInquiry(null);
        }}
        inquiry={selectedInquiry as any}
        properties={properties}
        users={users}
      />
      
      <EditPropertyModal
        isOpen={showEditPropertyModal}
        onClose={() => {
          setShowEditPropertyModal(false);
          setSelectedProperty(null);
        }}
        onPropertyUpdated={fetchAllData}
        property={selectedProperty as Property}
      />
      
      <AssignAgentModal
        isOpen={showAssignAgentModal}
        onClose={() => {
          setShowAssignAgentModal(false);
          setSelectedInquiry(null);
          setSelectedInquiryId(null);
        }}
        inquiryId={selectedInquiryId}
        onAssigned={fetchAllData}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-section {
            page-break-inside: avoid;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;