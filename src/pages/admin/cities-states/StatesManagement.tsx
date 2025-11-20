import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Map } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pyFetch } from '@/utils/backend';

interface State {
  id: string;
  name: string;
  code: string;
  region: string;
  is_active: boolean;
  created_at: string;
}

const StatesManagement: React.FC = () => {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [newState, setNewState] = useState({
    name: '',
    code: '',
    region: '',
    is_active: true
  });

  const indianRegions = [
    'Northern India',
    'Southern India',
    'Eastern India',
    'Western India',
    'Central India',
    'Northeast India'
  ];

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
  // Fetch states from Python API if available; else fallback to empty
  const data = await pyFetch('/api/admin/states', { method: 'GET', useApiKey: true }).catch(() => []);
  setStates((Array.isArray(data) ? data : []) as State[]);
    } catch (error) {
      console.error('Error fetching states:', error);
      setStates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddState = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
  const created = await pyFetch('/api/admin/states', { method: 'POST', useApiKey: true, body: JSON.stringify(newState) });
  setStates(prev => [...prev, Array.isArray(created) ? created[0] : created]);
      setShowAddModal(false);
      setNewState({
        name: '',
        code: '',
        region: '',
        is_active: true
      });
      
      toast.success('State added successfully!');
    } catch (error) {
      console.error('Error adding state:', error);
      toast.error('Failed to add state');
    }
  };

  const handleUpdateState = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingState) return;
    
    try {
  await pyFetch(`/api/admin/states/${editingState.id}`, { method: 'PATCH', useApiKey: true, body: JSON.stringify(editingState) });
      setStates(prev => prev.map(state => 
        state.id === editingState.id ? editingState : state
      ));
      
      setEditingState(null);
      toast.success('State updated successfully!');
    } catch (error) {
      console.error('Error updating state:', error);
      toast.error('Failed to update state');
    }
  };

  const handleDeleteState = async (stateId: string) => {
    if (!confirm('Are you sure you want to delete this state? This will affect all cities in this state.')) return;
    
    try {
  await pyFetch(`/api/admin/states/${stateId}`, { method: 'DELETE', useApiKey: true });
      setStates(prev => prev.filter(state => state.id !== stateId));
      toast.success('State deleted successfully!');
    } catch (error) {
      console.error('Error deleting state:', error);
      toast.error('Failed to delete state');
    }
  };

  const toggleStateStatus = async (stateId: string) => {
    try {
  const existing = states.find(s => s.id === stateId);
  if (!existing) return;
  const updated = { ...existing, is_active: !existing.is_active };
  await pyFetch(`/api/admin/states/${stateId}`, { method: 'PATCH', useApiKey: true, body: JSON.stringify({ is_active: updated.is_active }) });
  setStates(prev => prev.map(s => s.id === stateId ? updated : s));
      toast.success('State status updated!');
    } catch (error) {
      console.error('Error updating state status:', error);
      toast.error('Failed to update state status');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">States Management</h1>
          <p className="text-gray-600">Manage supported states and union territories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add State
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Map className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total States</p>
              <p className="text-2xl font-bold text-gray-900">{states.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active States</p>
              <p className="text-2xl font-bold text-gray-900">
                {states.filter(s => s.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive States</p>
              <p className="text-2xl font-bold text-gray-900">
                {states.filter(s => !s.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <Map className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Regions</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(states.map(s => s.region)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* States Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region
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
            {states.map((state) => (
              <tr key={state.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{state.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {state.code}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {state.region}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleStateStatus(state.id)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      state.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {state.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingState(state)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteState(state.id)}
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

      {/* Add State Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New State</h2>
            <form onSubmit={handleAddState} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State Name *
                </label>
                <input
                  type="text"
                  value={newState.name}
                  onChange={(e) => setNewState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  placeholder="e.g., Maharashtra"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State Code *
                </label>
                <input
                  type="text"
                  value={newState.code}
                  onChange={(e) => setNewState(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  placeholder="e.g., MH"
                  maxLength={2}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region *
                </label>
                <select
                  value={newState.region}
                  onChange={(e) => setNewState(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                >
                  <option value="">Select Region</option>
                  {indianRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
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
                  Add State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit State Modal */}
      {editingState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit State</h2>
            <form onSubmit={handleUpdateState} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State Name *
                </label>
                <input
                  type="text"
                  value={editingState.name}
                  onChange={(e) => setEditingState(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State Code *
                </label>
                <input
                  type="text"
                  value={editingState.code}
                  onChange={(e) => setEditingState(prev => prev ? { ...prev, code: e.target.value.toUpperCase() } : null)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  maxLength={2}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region *
                </label>
                <select
                  value={editingState.region}
                  onChange={(e) => setEditingState(prev => prev ? { ...prev, region: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                >
                  {indianRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingState(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#90C641] text-white rounded-lg hover:bg-[#7DAF35]"
                >
                  Update State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatesManagement;