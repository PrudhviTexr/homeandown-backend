import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, Shield, CheckCircle, FileText, Download, Eye } from 'lucide-react';
import { DatabaseUser as UserType } from '@/types/database';
import { getStatusBadge, getUserTypeColor } from '@/utils/adminHelpers';
import { AdminApi, FilesApi } from '@/services/pyApi';

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ isOpen, onClose, user }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchDocuments();
    }
  }, [isOpen, user]);

  const fetchDocuments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await AdminApi.documents({ entity_type: 'user', entity_id: user.id });
      const list = Array.isArray(data)
        ? data
        : (data && typeof data === 'object' && 'items' in (data as any) && Array.isArray((data as any).items)
            ? (data as any).items
            : []);
      setDocuments(list as any[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">User Details</h2>
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user.first_name} {user.last_name}</h3>
              <div className="flex items-center mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
                  {user.user_type}
                </span>
                <span className="mx-2">•</span>
                {getStatusBadge(user.status)}
                <span className="mx-2">•</span>
                {getStatusBadge(user.verification_status)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 border-b pb-2">Contact Information</h4>
              
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{user.phone_number || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{user.city || 'Not provided'}{user.city && user.state ? ', ' : ''}{user.state || ''}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 border-b pb-2">Account Information</h4>
              
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium">{user.custom_id || user.id}</p>
                </div>
              </div>
              
              {user.agent_license_number && (
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">License Number</p>
                    <p className="font-medium">{user.agent_license_number || 'Not Assigned'}</p>
                  </div>
                </div>
              )}
              {typeof user.account_verified !== 'undefined' && (
                <div className="flex items-center">
                  <CheckCircle className={`w-5 h-5 mr-3 ${user.account_verified ? 'text-green-500' : 'text-gray-300'}`} />
                  <div>
                    <p className="text-sm text-gray-500">Bank Verified</p>
                    <p className="font-medium">{user.account_verified ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">
                    {new Date(user.created_at || new Date()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio and Notes */}
          <div className="mt-6 space-y-4">
            {user.bio && (
              <div>
                <h4 className="font-semibold text-gray-800 border-b pb-2 mb-2">Bio</h4>
                <p className="text-sm text-gray-600">{user.bio}</p>
              </div>
            )}
            {user.admin_notes && (
              <div>
                <h4 className="font-semibold text-gray-800 border-b pb-2 mb-2">Admin Notes</h4>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md">{user.admin_notes}</p>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="mt-8">
            <h4 className="font-semibold text-gray-800 border-b pb-2 mb-4">Uploaded Documents</h4>
            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No documents uploaded</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {doc.document_category || 'document'} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          try {
                            const url = FilesApi.publicUrlById(doc.id);
                            window.open(url, '_blank');
                          } catch (e) {
                            console.error('Open failed:', e);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          try {
                            const url = FilesApi.publicUrlById(doc.id);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = doc.name || 'document';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } catch (e) {
                            console.error('Download failed:', e);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            {user.rejection_reason && (
              <div className="mr-auto text-sm text-red-600 max-w-md">
                Rejection Reason: {user.rejection_reason}
              </div>
            )}
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

export default ViewUserModal;