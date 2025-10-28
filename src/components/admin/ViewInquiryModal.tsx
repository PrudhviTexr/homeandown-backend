import React from 'react';
import { X, MessageSquare, MapPin, User, Mail, Phone, Calendar, CheckCircle, XCircle, AlertCircle, UserCheck } from 'lucide-react';
import { Inquiry } from '@/types/admin';
import { Property, DatabaseUser } from '@/types/database'; // Import types
import { getStatusBadge } from '@/utils/adminHelpers';

interface ViewInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry: Inquiry | null;
  properties: Property[]; // Add properties prop
  users: DatabaseUser[]; // Add users prop
}

const ViewInquiryModal: React.FC<ViewInquiryModalProps> = ({ isOpen, onClose, inquiry, properties, users }) => {
  if (!isOpen || !inquiry) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'responded':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'new':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const property = properties.find(p => p.id === inquiry.property_id);
  const agent = property?.agent_id ? users.find(u => u.id === property.agent_id) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Inquiry Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              {getStatusIcon(inquiry.status)}
            </div>
            <div>
              <h3 className="text-xl font-semibold">Inquiry #{inquiry.id.substring(0, 8)}</h3>
              <div className="flex items-center mt-1">
                {getStatusBadge(inquiry.status)}
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  Received on {new Date(inquiry.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Inquirer Information</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{inquiry.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{inquiry.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{inquiry.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Property Information</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Property</p>
                    <p className="font-medium">{property?.title || 'Unknown Property'}</p>
                    <p className="text-sm text-gray-600">ID: {property?.custom_id || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Inquiry Date</p>
                    <p className="font-medium">
                      {new Date(inquiry.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {agent && (
                  <div className="flex items-center">
                    <UserCheck className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Assigned Agent</p>
                      <p className="font-medium">{`${agent.first_name} ${agent.last_name}`}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Inquiry Message</h4>
            <div className="bg-white p-4 rounded border border-blue-100">
              <p className="text-gray-700 whitespace-pre-line">{inquiry.message}</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewInquiryModal;