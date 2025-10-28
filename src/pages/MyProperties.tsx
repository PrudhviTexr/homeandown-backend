import React, { useState, useEffect } from 'react';
import { Home, Plus, Edit, Trash2, DollarSign, Users, Wrench } from 'lucide-react';
// Data fetching should use Python API services.
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-hot-toast';
import AddPropertyModal from '../components/admin/AddPropertyModal';
import EditPropertyModal from '../components/admin/EditPropertyModal';
import { pyFetch } from '../utils/backend';

interface Property {
  id: string;
  title: string;
  property_type: string;
  city: string;
  state: string;
  price: number;
  monthly_rent: number | null;
  listing_type: 'SALE' | 'RENT';
  status: string;
  images: string[] | null;
}

const MyProperties: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const handleEditClick = (property: Property) => {
    console.log('[MyProperties] Edit clicked for property:', property);
    console.log('[MyProperties] Property ID:', property.id);
    console.log('[MyProperties] Property ID type:', typeof property.id);
    setSelectedProperty(property);
    setShowEditModal(true);
  };

  const handlePropertyUpdated = () => {
    setShowEditModal(false);
    setSelectedProperty(null);
    fetchProperties();
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      await pyFetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        useApiKey: true
      });
      
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error(error.message || 'Failed to delete property');
    }
  };

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      console.log('[MyProperties] Fetching properties for user:', user?.id);
      
      // Fetch properties for the current user using owner_id filter
      const userId = (user as any)?.id;
      const response = await pyFetch(`/api/properties?owner_id=${encodeURIComponent(userId)}`, {
        useApiKey: true
      });
      
      console.log('[MyProperties] Properties response:', response);
      setProperties(response || []);
      
    } catch (error) {
      console.error('[MyProperties] Error fetching properties:', error);
      toast.error('An error occurred while fetching properties');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePropertyAdded = () => {
    setShowAddModal(false);
    fetchProperties();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-28 pb-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90C641]"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Properties</h1>
              <p className="text-gray-600">Manage all your properties, rentals, and maintenance</p>
            </div>
            <button className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center" onClick={() => setShowAddModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Add Property
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                </div>
                <Home className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">For Sale</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {properties.filter(p => p.listing_type === 'SALE').length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">For Rent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {properties.filter(p => p.listing_type === 'RENT').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <Wrench className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Properties List */}
          {properties.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
              <p className="text-gray-600 mb-6">You haven't added any properties yet. Start by adding your first property.</p>
              <button className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors" onClick={() => setShowAddModal(true)}>
                Add Your First Property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Property Image */}
                  <div className="h-48 bg-gray-200 relative">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Home className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        property.listing_type === 'SALE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {property.listing_type === 'SALE' ? 'For Sale' : 'For Rent'}
                      </span>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{property.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{property.city}, {property.state}</p>
                    <p className="text-gray-600 text-sm mb-3 capitalize">{property.property_type}</p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      {property.listing_type === 'SALE' ? (
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(property.price)}
                        </p>
                      ) : (
                        <p className="text-xl font-bold text-gray-900">
                          {property.monthly_rent ? formatCurrency(property.monthly_rent) : 'Price not set'}/month
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm flex items-center justify-center" onClick={() => handleEditClick(property)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="flex-1 bg-[#90C641] text-white px-3 py-2 rounded-md hover:bg-[#7DAF35] transition-colors text-sm flex items-center justify-center">
                        <Wrench className="w-4 h-4 mr-1" />
                        Manage
                      </button>
                      <button className="bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition-colors" onClick={() => handleDeleteProperty(property.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddPropertyModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onPropertyAdded={handlePropertyAdded} />
      <EditPropertyModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} onPropertyUpdated={handlePropertyUpdated} property={selectedProperty as any} />
      <Footer />
    </div>
  );
};

export default MyProperties;
