import React, { useEffect, useState } from 'react';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { pyFetch } from '@/utils/backend';

interface PropertyAssignmentTrackingModalProps {
  propertyId: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AssignmentHistory {
  id: string;
  agent_id: string;
  agent_name: string;
  assigned_at: string;
  status: string;
  response_time?: string;
}

const PropertyAssignmentTrackingModal: React.FC<PropertyAssignmentTrackingModalProps> = ({
  propertyId,
  propertyTitle,
  isOpen,
  onClose
}) => {
  const [history, setHistory] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && propertyId) {
      fetchAssignmentHistory();
    }
  }, [isOpen, propertyId]);

  const fetchAssignmentHistory = async () => {
    setLoading(true);
    try {
      const data = await pyFetch(`/api/admin/properties/${propertyId}/assignment-history`, {
        method: 'GET',
        useApiKey: false,
      });
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Assignment History: {propertyTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No assignment history available
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div
                  key={item.id || index}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {item.agent_name}
                        </span>
                        {item.status === 'accepted' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {item.status === 'rejected' && (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        {item.status === 'pending' && (
                          <Clock className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(item.assigned_at).toLocaleString()}
                        </span>
                        {item.response_time && (
                          <span>Response time: {item.response_time}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyAssignmentTrackingModal;
