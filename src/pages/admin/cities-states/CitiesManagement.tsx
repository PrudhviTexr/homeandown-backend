import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pyFetch } from '@/utils/backend';

interface City {
  id: string;
  name: string;
  state: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
}

const CitiesManagement: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [newCity, setNewCity] = useState({
    name: '',
    state: '',
    image_url: '',
    latitude: 0,
    longitude: 0,
    is_active: true
  });

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
  const data = await pyFetch('/api/admin/cities', { method: 'GET', useApiKey: true }).catch(() => []);
  setCities((Array.isArray(data) ? data : []) as City[]);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
  const created = await pyFetch('/api/admin/cities', { method: 'POST', useApiKey: true, body: JSON.stringify(newCity) });
  setCities(prev => [...prev, Array.isArray(created) ? created[0] : created]);
      setShowAddModal(false);
      setNewCity({
        name: '',
        state: '',
        image_url: '',
        latitude: 0,
        longitude: 0,
        is_active: true
      });
      
      toast.success('City added successfully!');
    } catch (error) {
      console.error('Error adding city:', error);
      toast.error('Failed to add city');
    }
  };

  const handleUpdateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCity) return;
    
    try {
  await pyFetch(`/api/admin/cities/${editingCity.id}`, { method: 'PATCH', useApiKey: true, body: JSON.stringify(editingCity) });
      setCities(prev => prev.map(city => 
        city.id === editingCity.id ? editingCity : city
      ));
      
      setEditingCity(null);
      toast.success('City updated successfully!');
    } catch (error) {
      console.error('Error updating city:', error);
      toast.error('Failed to update city');
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    if (!confirm('Are you sure you want to delete this city?')) return;
    
    try {
  await pyFetch(`/api/admin/cities/${cityId}`, { method: 'DELETE', useApiKey: true });
      setCities(prev => prev.filter(city => city.id !== cityId));
      toast.success('City deleted successfully!');
    } catch (error) {
      console.error('Error deleting city:', error);
      toast.error('Failed to delete city');
    }
  };

  const toggleCityStatus = async (cityId: string) => {
    try {
  const existing = cities.find(c => c.id === cityId);
  if (!existing) return;
  const updated = { ...existing, is_active: !existing.is_active };
  await pyFetch(`/api/admin/cities/${cityId}`, { method: 'PATCH', useApiKey: true, body: JSON.stringify({ is_active: updated.is_active }) });
  setCities(prev => prev.map(c => c.id === cityId ? updated : c));
      toast.success('City status updated!');
    } catch (error) {
      console.error('Error updating city status:', error);
      toast.error('Failed to update city status');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90C641]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cities Management</h1>
          <p className="text-gray-600">Manage supported cities for property listings</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add City
        </button>
      </div>

      {/* Cities Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coordinates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cities.map((city) => (
              <tr key={city.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {city.image_url ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={city.image_url}
                          alt={city.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{city.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {city.state}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {city.latitude}, {city.longitude}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleCityStatus(city.id)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      city.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {city.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingCity(city)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCity(city.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add City Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New City</h2>
            <form onSubmit={handleAddCity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Name *
                </label>
                <input
                  type="text"
                  value={newCity.name}
                  onChange={(e) => setNewCity(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  value={newCity.state}
                  onChange={(e) => setNewCity(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newCity.latitude}
                    onChange={(e) => setNewCity(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newCity.longitude}
                    onChange={(e) => setNewCity(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={newCity.image_url}
                  onChange={(e) => setNewCity(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#90C641] text-white rounded-lg hover:bg-[#7DAF35]"
                >
                  Add City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit City Modal */}
      {editingCity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit City</h2>
            <form onSubmit={handleUpdateCity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Name *
                </label>
                <input
                  type="text"
                  value={editingCity.name}
                  onChange={(e) => setEditingCity(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  value={editingCity.state}
                  onChange={(e) => setEditingCity(prev => prev ? { ...prev, state: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                >
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingCity.latitude || 0}
                    onChange={(e) => setEditingCity(prev => prev ? { ...prev, latitude: parseFloat(e.target.value) || 0 } : null)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingCity.longitude || 0}
                    onChange={(e) => setEditingCity(prev => prev ? { ...prev, longitude: parseFloat(e.target.value) || 0 } : null)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={editingCity.image_url || ''}
                  onChange={(e) => setEditingCity(prev => prev ? { ...prev, image_url: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCity(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#90C641] text-white rounded-lg hover:bg-[#7DAF35]"
                >
                  Update City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitiesManagement;