import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MapPin, Bed, Bath, Square, Edit, Eye, Trash2 } from 'lucide-react';
import { AgentApi } from '@/services/pyApi';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import RoleBasedPropertyForm from '@/components/RoleBasedPropertyForm';

interface Property {
  id: string;
  title: string;
  property_type: string;
  listing_type: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  city: string;
  state: string;
  address: string;
  status: string;
  verified: boolean;
  featured: boolean;
  images: string[];
  custom_id: string;
  created_at: string;
}

const AgentProperties: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchAgentProperties();
  }, [refreshTrigger]);

  const fetchAgentProperties = async () => {
    try {
      setLoading(true);
      console.log('[AgentProperties] Fetching properties for agent:', user?.id);
      
      const response = await AgentApi.getProperties();
      const propertiesData = response?.properties || response || [];
      
      console.log('[AgentProperties] Fetched properties:', propertiesData.length);
      setProperties(propertiesData);
    } catch (error) {
      console.error('[AgentProperties] Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = () => {
    navigate('/seller/add-property');
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowAddPropertyModal(true);
  };

  const handleViewProperty = (property: Property) => {
    // Navigate to property details page
    navigate(`/property/${property.id}`);
  };

  const handlePropertySubmitSuccess = () => {
    setShowAddPropertyModal(false);
    setSelectedProperty(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.custom_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatIndianCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string, verified: boolean) => {
    if (verified) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Verified</span>;
    }
    
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Active</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Approval</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      case 'sold':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Sold</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
            <p className="text-gray-600 mt-1">Manage your property listings</p>
          </div>
          <button
            onClick={handleAddProperty}
            className="inline-flex items-center px-4 py-2 bg-[#90C641] text-white rounded-lg hover:bg-[#7ab32f] transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Property
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by title, city, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Properties</div>
          <div className="text-2xl font-bold text-gray-900">{properties.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {properties.filter(p => p.status === 'active' || p.verified).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {properties.filter(p => p.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Sold</div>
          <div className="text-2xl font-bold text-gray-600">
            {properties.filter(p => p.status === 'sold').length}
          </div>
        </div>
      </div>

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <MapPin className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first property listing'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={handleAddProperty}
              className="inline-flex items-center px-4 py-2 bg-[#90C641] text-white rounded-lg hover:bg-[#7ab32f]"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Property
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              {/* Property Image */}
              <div className="relative h-48 bg-gray-200">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {property.featured && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                    Featured
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(property.status, property.verified)}
                </div>
              </div>

              {/* Property Details */}
              <div className="p-4">
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">{property.custom_id}</div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.city}, {property.state}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  {property.bedrooms && (
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      {property.bedrooms}
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      {property.bathrooms}
                    </div>
                  )}
                  {property.area_sqft && (
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      {property.area_sqft} sqft
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-bold text-[#90C641]">
                    {formatIndianCurrency(property.price)}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{property.listing_type}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewProperty(property)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditProperty(property)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-[#90C641] text-white rounded-lg text-sm font-medium hover:bg-[#7ab32f]"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Property Modal */}
      <RoleBasedPropertyForm
        isOpen={showAddPropertyModal}
        onClose={() => {
          setShowAddPropertyModal(false);
          setSelectedProperty(null);
        }}
        onSuccess={handlePropertySubmitSuccess}
        property={selectedProperty || undefined}
        mode={selectedProperty ? 'edit' : 'add'}
      />
    </div>
  );
};

export default AgentProperties;

