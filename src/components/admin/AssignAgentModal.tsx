import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Clock } from 'lucide-react';
import { AdminApi } from '@/services/pyApi';
import { pyFetch } from '@/utils/backend';

interface AssignAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiryId: string | null;
  onAssigned: () => void;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  agent_license_number: string;
  experience_years: number;
  city: string;
  state: string;
  profile_image_url: string;
}

const AssignAgentModal: React.FC<AssignAgentModalProps> = ({ 
  isOpen, 
  onClose, 
  inquiryId,
  onAssigned
}) => {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<string>('24');

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    } else {
      // Reset form when modal closes
      setSelectedAgentId('');
      setNotes('');
      setExpiresIn('24');
    }
  }, [isOpen]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const all = (await AdminApi.users()) as any[];
      const filtered = (all || []).filter(u => String(u.user_type || '').toLowerCase() === 'agent' && (u.status || 'active') === 'active' && String(u.verification_status || '').toLowerCase() === 'verified');
      setAgents(filtered.map((u: any) => ({
        id: String(u.id),
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        phone_number: u.phone_number,
        agent_license_number: u.agent_license_number,
        city: u.city,
        state: u.state,
        profile_image_url: u.profile_image_url,
        experience_years: Number(u.experience_years) || 0,
      })));
    } catch (error) {
      console.error('Error fetching agents:', error);
      alert('Failed to load agents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryId || !selectedAgentId) return;
    
    setLoading(true);
    try {
      // Calculate expiration time
      const now = new Date();
      const expiresAt = new Date(now.getTime() + parseInt(expiresIn) * 60 * 60 * 1000);
      
  // Create agent assignment via Python API
    await pyFetch(`/api/admin/inquiries/${inquiryId}/assign-agent`, { method: 'POST', useApiKey: true, body: JSON.stringify({ agent_id: selectedAgentId, status: 'pending', assigned_at: now.toISOString(), expires_at: expiresAt.toISOString(), notes }) });
      
      onAssigned();
      onClose();
      alert('Agent assigned successfully! They will need to accept the assignment.');
    } catch (error) {
      console.error('Error assigning agent:', error);
      alert('Failed to assign agent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Assign Agent to Inquiry</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {loading && agents.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Agent *
                </label>
                <div className="space-y-4">
                  {agents.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No verified agents available</p>
                  ) : (
                    agents.map(agent => (
                      <div 
                        key={agent.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedAgentId === agent.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedAgentId(agent.id)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {agent.profile_image_url ? (
                              <img 
                                src={agent.profile_image_url} 
                                alt={`${agent.first_name} ${agent.last_name}`}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">{agent.first_name} {agent.last_name}</h4>
                            <p className="text-xs text-gray-500">License: {agent.agent_license_number || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{agent.experience_years} years experience • {agent.city}, {agent.state}</p>
                          </div>
                          <div className="ml-auto">
                            <input 
                              type="radio" 
                              name="agent" 
                              checked={selectedAgentId === agent.id}
                              onChange={() => setSelectedAgentId(agent.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any special instructions or details for the agent..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Expires In
                </label>
                <div className="flex items-center">
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="4">4 hours</option>
                    <option value="8">8 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                  </select>
                  <div className="ml-4 flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Agent must respond within this time</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">How Agent Assignment Works</h4>
                    <p className="text-xs text-blue-600 mt-1">
                      The selected agent will receive a notification and must accept the assignment within the specified time.
                      If they don't respond, you'll need to assign another agent.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedAgentId}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Agent'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AssignAgentModal;