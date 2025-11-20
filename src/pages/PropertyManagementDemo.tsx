import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import RoleBasedPropertyForm from '@/components/RoleBasedPropertyForm';
import { useAuth } from '@/contexts/AuthContext';

const PropertyManagementDemo: React.FC = () => {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);

  const handleAddProperty = () => {
    setIsAddModalOpen(true);
  };

  const handleEditProperty = (property: any) => {
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  const handlePropertySuccess = () => {
    // Refresh properties list
    console.log('Property operation successful');
    // You would typically refetch the properties list here
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedProperty(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Management</h1>
        <p className="text-gray-600">
          Welcome, {user?.first_name}! Manage your properties with our unified form system.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleAddProperty}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add New Property
        </button>
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Properties</h2>
        </div>
        
        <div className="p-6">
          {properties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No properties found. Add your first property to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{property.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{property.description}</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProperty(property)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this property?')) {
                          // Handle delete
                          console.log('Delete property:', property.id);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RoleBasedPropertyForm
        isOpen={isAddModalOpen}
        onClose={handleCloseModals}
        onSuccess={handlePropertySuccess}
        mode="add"
      />

      <RoleBasedPropertyForm
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        onSuccess={handlePropertySuccess}
        property={selectedProperty}
        mode="edit"
      />
    </div>
  );
};

export default PropertyManagementDemo;
