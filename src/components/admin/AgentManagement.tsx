import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, Eye, Edit, Filter, Search, 
  Calendar, MapPin, Phone, Mail, Award, Clock, AlertCircle,
  CheckCircle, XCircle, MoreVertical, Download, Upload
} from 'lucide-react';
import { getApiUrl } from '@/utils/backend';

interface AgentManagementProps {
  onAgentUpdate?: () => void;
}

interface PendingAgent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  city: string;
  state: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  licenseNumber?: string;
  customId?: string;
  createdAt: string;
  documents?: any[];
  roleRequests?: any[];
}

interface AgentProfile {
  agent: PendingAgent;
  documents: any[];
  roleRequests: any[];
  applicationDate: string;
  lastUpdated: string;
  status: string;
  verificationStatus: string;
  licenseNumber?: string;
  customId?: string;
}

const AgentManagement: React.FC<AgentManagementProps> = ({ onAgentUpdate }) => {
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<PendingAgent | null>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchPendingAgents();
  }, []);

  const fetchPendingAgents = async () => {
    try {
      setLoading(true);
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      // Fetch all users first
      const usersResponse = await fetch(getApiUrl('/api/admin/users'), { headers });
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        const agents = users.filter((user: any) => user.user_type === 'agent');
        
        const formattedAgents = agents.map((agent: any) => ({
          id: agent.id,
          email: agent.email,
          firstName: agent.first_name || '',
          lastName: agent.last_name || '',
          phoneNumber: agent.phone_number || '',
          city: agent.city || '',
          state: agent.state || '',
          status: agent.status || 'pending',
          verificationStatus: agent.verification_status || 'pending',
          licenseNumber: agent.license_number || agent.agent_license_number,
          customId: agent.custom_id,
          createdAt: agent.created_at,
          documents: [],
          roleRequests: []
        }));

        setPendingAgents(formattedAgents);
      }
    } catch (error) {
      console.error('Error fetching pending agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentProfile = async (agentId: string) => {
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      const response = await fetch(getApiUrl(`/api/admin/agents/${agentId}/profile`), { headers });
      if (response.ok) {
        const profile = await response.json();
        setAgentProfile(profile);
      } else {
        // Fallback: create profile from agent data
        const agent = pendingAgents.find(a => a.id === agentId);
        if (agent) {
          setAgentProfile({
            agent,
            documents: agent.documents || [],
            roleRequests: agent.roleRequests || [],
            applicationDate: agent.createdAt,
            lastUpdated: agent.createdAt,
            status: agent.status,
            verificationStatus: agent.verificationStatus,
            licenseNumber: agent.licenseNumber,
            customId: agent.customId
          });
        }
      }
    } catch (error) {
      console.error('Error fetching agent profile:', error);
    }
  };

  const handleApproveAgent = async (agentId: string) => {
    try {
      setActionLoading(agentId);
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      
      const response = await fetch(getApiUrl(`/api/admin/agents/${agentId}/approve`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          approval_notes: 'Agent approved by admin'
        })
      });

      if (response.ok) {
        // Update local state
        setPendingAgents(agents => 
          agents.map(agent => 
            agent.id === agentId 
              ? { ...agent, status: 'approved', verificationStatus: 'verified' }
              : agent
          )
        );
        
        if (onAgentUpdate) {
          onAgentUpdate();
        }
      }
    } catch (error) {
      console.error('Error approving agent:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAgent = async (agentId: string, reason: string) => {
    try {
      setActionLoading(agentId);
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      
      const response = await fetch(getApiUrl(`/api/admin/agents/${agentId}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          rejection_reason: reason
        })
      });

      if (response.ok) {
        // Update local state
        setPendingAgents(agents => 
          agents.map(agent => 
            agent.id === agentId 
              ? { ...agent, status: 'rejected', verificationStatus: 'rejected' }
              : agent
          )
        );
        
        if (onAgentUpdate) {
          onAgentUpdate();
        }
      }
    } catch (error) {
      console.error('Error rejecting agent:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAgents = pendingAgents.filter(agent => {
    const matchesTab = activeTab === 'all' || agent.status === activeTab;
    const matchesSearch = agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.phoneNumber.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
          <p className="text-gray-600">Manage agent applications and approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPendingAgents}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Applications</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingAgents.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved Agents</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingAgents.filter(a => a.status === 'approved').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected Applications</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingAgents.filter(a => a.status === 'rejected').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'pending', label: 'Pending', count: pendingAgents.filter(a => a.status === 'pending').length },
            { id: 'approved', label: 'Approved', count: pendingAgents.filter(a => a.status === 'approved').length },
            { id: 'rejected', label: 'Rejected', count: pendingAgents.filter(a => a.status === 'rejected').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {agent.firstName.charAt(0)}{agent.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {agent.firstName} {agent.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{agent.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{agent.city}, {agent.state}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{agent.licenseNumber || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{agent.customId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                      {getStatusIcon(agent.status)}
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedAgent(agent);
                          fetchAgentProfile(agent.id);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {agent.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveAgent(agent.id)}
                            disabled={actionLoading === agent.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) {
                                handleRejectAgent(agent.id, reason);
                              }
                            }}
                            disabled={actionLoading === agent.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Profile Modal */}
      {selectedAgent && agentProfile && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Agent Profile: {agentProfile.agent.firstName} {agentProfile.agent.lastName}
                </h3>
                <button
                  onClick={() => {
                    setSelectedAgent(null);
                    setAgentProfile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{agentProfile.agent.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{agentProfile.agent.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {agentProfile.agent.city}, {agentProfile.agent.state}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Number</label>
                    <p className="mt-1 text-sm text-gray-900">{agentProfile.licenseNumber || 'N/A'}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agentProfile.status)}`}>
                      {getStatusIcon(agentProfile.status)}
                      {agentProfile.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Verification Status</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agentProfile.verificationStatus)}`}>
                      {getStatusIcon(agentProfile.verificationStatus)}
                      {agentProfile.verificationStatus}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Application Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(agentProfile.applicationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(agentProfile.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {agentProfile.status === 'pending' && (
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleApproveAgent(agentProfile.agent.id);
                        setSelectedAgent(null);
                        setAgentProfile(null);
                      }}
                      disabled={actionLoading === agentProfile.agent.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <UserCheck className="h-4 w-4" />
                      Approve Agent
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          handleRejectAgent(agentProfile.agent.id, reason);
                          setSelectedAgent(null);
                          setAgentProfile(null);
                        }
                      }}
                      disabled={actionLoading === agentProfile.agent.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <UserX className="h-4 w-4" />
                      Reject Agent
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagement;