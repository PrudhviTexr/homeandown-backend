import React, { useState, useEffect } from 'react';
import { AdminApi } from '@/services/pyApi';
import { User, FileText, Image, Download, Eye, Calendar, Mail, Phone, MapPin, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserDocument {
  id: string;
  entity_type: string;
  entity_id: string;
  name: string;
  url: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

interface UserDetails {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  city: string;
  state: string;
  user_type: string;
  status: string;
  verification_status: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  custom_id?: string;
  agent_license_number?: string;
}

interface UserReviewModalProps {
  user: UserDetails;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason: string) => void;
}

const UserReviewModal: React.FC<UserReviewModalProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject 
}) => {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDocuments();
    }
  }, [isOpen, user]);

  const fetchUserDocuments = async () => {
    try {
      setLoading(true);
      const docs = await AdminApi.documents({ entity_type: 'user', entity_id: user.id });
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error fetching user documents:', error);
      toast.error('Failed to load user documents');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadDocument = async (document: UserDocument) => {
    try {
      const response = await fetch(document.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const viewDocument = (document: UserDocument) => {
    setSelectedDocument(document);
  };

  const handleApprove = () => {
    onApprove(user.id);
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    onReject(user.id, rejectReason);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-hidden w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                User Review - {user.first_name} {user.last_name}
              </h3>
              <p className="text-sm text-gray-600">
                Review user details and documents before approval
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-auto max-h-[70vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Details */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    User Information
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <span className="ml-2 text-gray-900">{user.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                        <span className="ml-2 text-gray-900">{user.phone_number || 'Not provided'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-600">Location:</span>
                        <span className="ml-2 text-gray-900">
                          {user.city || 'N/A'}, {user.state || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-600">User Type:</span>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {user.user_type?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-600">Registered:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {user.custom_id && (
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">Custom ID:</span>
                        <span className="ml-2 text-gray-900">{user.custom_id}</span>
                      </div>
                    )}
                    
                    {user.agent_license_number && (
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">License Number:</span>
                        <span className="ml-2 text-gray-900">{user.agent_license_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Information */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Current Status
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Verification Status:</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        {user.verification_status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Account Status:</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {user.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Email Verified:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.email_verified ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    User Documents ({documents.length})
                  </h4>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 rounded-full"></div>
                      <span className="ml-2">Loading documents...</span>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No documents uploaded</p>
                      <p className="text-sm">User has not uploaded any documents yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {getFileIcon(doc.file_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {doc.name}
                                </p>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => viewDocument(doc)}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadDocument(doc)}
                                    className="text-green-600 hover:text-green-800 text-xs"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                <div>Size: {formatFileSize(doc.file_size)}</div>
                                <div>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Review all information before making a decision
              </div>
              
              <div className="flex space-x-3">
                {!showRejectForm ? (
                  <>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <XCircle className="h-4 w-4 mr-2 inline" />
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <CheckCircle className="h-4 w-4 mr-2 inline" />
                      Approve User
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <XCircle className="h-4 w-4 mr-2 inline" />
                      Reject User
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {showRejectForm && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this user..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedDocument.name}
              </h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[70vh]">
              {selectedDocument.file_type.startsWith('image/') ? (
                <img
                  src={selectedDocument.url}
                  alt={selectedDocument.name}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <button
                    onClick={() => downloadDocument(selectedDocument)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2 inline" />
                    Download Document
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <div>Size: {formatFileSize(selectedDocument.file_size)}</div>
                  <div>Uploaded: {new Date(selectedDocument.created_at).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => downloadDocument(selectedDocument)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2 inline" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserReviewModal;
