import React, { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminApi } from '@/services/pyApi';
import { pyFetch } from '@/utils/backend';

interface Agent {
  id: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  agent_license_number?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  account_verified?: boolean;
  account_verified_at?: string;
}

const AgentBankDetails: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentBankDetails();
  }, []);

  const fetchAgentBankDetails = async () => {
    setLoading(true);
    try {
      const users = (await AdminApi.users()) as any[];
      const agentsOnly = (users || [])
        .filter(u => String(u.user_type || u.role || '').toLowerCase() === 'agent')
        .map(u => ({
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          agent_license_number: u.agent_license_number,
          bank_account_number: u.bank_account_number,
          ifsc_code: u.ifsc_code,
          account_verified: !!u.account_verified,
          account_verified_at: u.account_verified_at,
        })) as Agent[];
      setAgents(agentsOnly);
    } catch (error) {
      console.error('Error fetching agent bank details:', error);
      toast.error('Failed to load agent bank details');
    } finally {
      setLoading(false);
    }
  };

  const verifyBankAccount = async (agentId: string | number) => {
    setVerifyingId(String(agentId));
    try {
  await pyFetch(`/api/admin/users/${String(agentId)}/verify-bank`, { method: 'POST', useApiKey: true });
      toast.success('Bank account verified successfully');
      fetchAgentBankDetails();
    } catch (error) {
      console.error('Error verifying bank account:', error);
      toast.error('Failed to verify bank account');
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Agent Bank Account Details</h3>
      
      {agents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No agent bank details found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IFSC Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{agent.first_name} {agent.last_name}</div>
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agent.agent_license_number || 'Not assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agent.bank_account_number ? 
                      `XXXX${agent.bank_account_number.slice(-4)}` : 
                      'Not provided'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agent.ifsc_code || 'Not provided'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {agent.account_verified ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" /> Verified
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        <AlertCircle className="w-4 h-4 mr-1" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!agent.account_verified && (
                      <button
                        onClick={() => verifyBankAccount(agent.id)}
                        disabled={verifyingId === String(agent.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        {verifyingId === agent.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verify
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgentBankDetails;