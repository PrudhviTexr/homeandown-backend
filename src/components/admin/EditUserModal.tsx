import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Eye, CheckCircle, XCircle } from 'lucide-react';
import { pyFetch } from '@/utils/backend';
import { AdminApi, FilesApi } from '@/services/pyApi';
import toast from 'react-hot-toast';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: any;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onUserUpdated, user }) => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    user_type: 'buyer',
    status: 'active',
    verification_status: 'pending',
    date_of_birth: '',
    address: '',
    bio: '',
    admin_notes: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        user_type: user.user_type || 'buyer',
        status: user.status || 'active',
        verification_status: user.verification_status || 'pending',
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        bio: user.bio || '',
        admin_notes: user.admin_notes || '',
      });
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    setDocumentsLoading(true);
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
      setDocumentsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Remove empty fields from form data to avoid overwriting with null
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '' && v !== null)
      );

      await pyFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        useApiKey: true,
        body: JSON.stringify(payload)
      });

      onUserUpdated();
      onClose();
      toast.success('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      // Try to surface server-side message if available
      try {
        const e: any = error;
        let msg = e && e.message ? e.message : String(e);
        // If message is JSON, parse and show nested detail.message or detail
        if (msg && msg.trim().startsWith('{')) {
          const parsed = JSON.parse(msg);
          msg = parsed?.detail?.message || parsed?.detail || parsed?.message || msg;
        }
        toast.error(msg || 'Failed to update user');
      } catch (_ex) {
        toast.error('Failed to update user. Please try again.');
      }
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
            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Type *
              </label>
              <select
                name="user_type"
                value={formData.user_type}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Status *
              </label>
              <select
                name="verification_status"
                value={formData.verification_status}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes
            </label>
            <textarea
              name="admin_notes"
              value={formData.admin_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Documents Section */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
            {documentsLoading ? (
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
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
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
                            toast.error('Failed to open document');
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
                            toast.error('Failed to download document');
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await AdminApi.approveDocument(doc.id);
                            toast.success('Document approved');
                            fetchDocuments(); // Refresh documents
                          } catch (e) {
                            console.error('Approve failed:', e);
                            toast.error('Failed to approve document');
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await AdminApi.rejectDocument(doc.id, { reason: 'Document does not meet requirements' });
                            toast.success('Document rejected');
                            fetchDocuments(); // Refresh documents
                          } catch (e) {
                            console.error('Reject failed:', e);
                            toast.error('Failed to reject document');
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;