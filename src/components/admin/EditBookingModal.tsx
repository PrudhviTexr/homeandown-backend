import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Home, MessageSquare } from 'lucide-react';
import { Booking } from '@/types/database';
import { AdminApi, RecordsApi } from '@/services/pyApi';
// pyFetch no longer needed directly after switching to AdminApi.patchBookingFull

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdated: () => void;
  booking: Booking | null;
}

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  custom_id: string;
}

interface UserOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  custom_id: string;
}

const EditBookingModal: React.FC<EditBookingModalProps> = ({ 
  isOpen, 
  onClose, 
  onBookingUpdated, 
  booking 
}) => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [agents, setAgents] = useState<UserOption[]>([]);
  
  const [formData, setFormData] = useState({
    property_id: '',
    user_id: '',
    agent_id: '',
    booking_date: '',
    booking_time: '',
    notes: '',
    status: 'pending'
  });

  useEffect(() => {
    if (isOpen && booking) {
      fetchProperties();
      fetchUsers();
      fetchAgents();
      
      // Set form data from booking
      setFormData({
        property_id: booking.property_id || '',
        user_id: booking.user_id || '',
        agent_id: booking.agent_id || '',
        booking_date: booking.booking_date || '',
        booking_time: booking.booking_time || '',
        notes: booking.notes || '',
        status: booking.status || 'pending'
      });
    }
  }, [isOpen, booking]);

  const fetchProperties = async () => {
    try {
  const all = (await RecordsApi.listProperties()) as any[];
  const active = (all || []).filter(p => (p.status || 'active') === 'active');
  setProperties(active.map(p => ({ id: String(p.id), title: p.title, address: p.address, city: p.city, custom_id: p.custom_id || String(p.id) })));
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchUsers = async () => {
    try {
  const all = (await AdminApi.users()) as any[];
  const buyers = (all || []).filter(u => String(u.user_type || '').toLowerCase() === 'buyer' && (u.status || 'active') === 'active');
  setUsers(buyers.map(u => ({ id: String(u.id), first_name: u.first_name, last_name: u.last_name, email: u.email, custom_id: u.custom_id || String(u.id) })));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAgents = async () => {
    try {
  const all = (await AdminApi.users()) as any[];
  const agents = (all || []).filter(u => String(u.user_type || '').toLowerCase() === 'agent' && (u.status || 'active') === 'active' && String(u.verification_status || '').toLowerCase() === 'verified');
  setAgents(agents.map(u => ({ id: String(u.id), first_name: u.first_name, last_name: u.last_name, email: u.email, custom_id: u.custom_id || String(u.id) })));
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.booking_date || !formData.booking_time) {
        throw new Error('Please fill in booking date and time');
      }

      if (!formData.user_id) {
        throw new Error('Please select a customer');
      }

      // Update booking via Python API
      await AdminApi.patchBookingFull(booking.id, {
        status: formData.status,
        agent_notes: formData.notes || null,
        booking_date: formData.booking_date || null,
        booking_time: formData.booking_time || null,
      });

      onBookingUpdated();
      onClose();
      alert('Booking updated successfully!');
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(`Failed to update booking: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Edit Booking</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Property Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property *
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleInputChange}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title} ({property.custom_id}) - {property.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Customer</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.custom_id}) - {user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Agent Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select
                  name="agent_id"
                  value={formData.agent_id}
                  onChange={handleInputChange}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name} ({agent.custom_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Booking Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    name="booking_date"
                    value={formData.booking_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="time"
                    name="booking_time"
                    value={formData.booking_time ? formData.booking_time.substring(0, 5) : ''}
                    onChange={(e) => handleInputChange({
                      ...e,
                      target: {
                        ...e.target,
                        name: 'booking_time',
                        value: e.target.value + ':00'
                      }
                    } as React.ChangeEvent<HTMLInputElement>)}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-gray-400" size={16} />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any special instructions or notes..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />}
              {loading ? 'Updating...' : 'Update Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBookingModal;