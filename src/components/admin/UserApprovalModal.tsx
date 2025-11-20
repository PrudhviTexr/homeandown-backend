import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminApi, FilesApi } from '@/services/pyApi';

interface UserApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onApprovalChange: () => void;
}

const UserApprovalModal: React.FC<UserApprovalModalProps> = ({
  isOpen,
  onClose,
  user,
  onApprovalChange
}) => {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [approvalData, setApprovalData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserProfile();
      fetchApprovalData();
  fetchDocuments();
    }
  }, [isOpen, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
  // Fetch agent or seller profile via Admin API
  const users = (await AdminApi.users()) as any[];
  const found = (users || []).find(u => String(u.id) === String(user.id));
  if (found) setUserProfile(found);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchApprovalData = async () => {
    if (!user) return;
    
    try {
  // If backend exposes approvals, fetch; otherwise synthesize from user
  const users = (await AdminApi.users()) as any[];
  const found = (users || []).find(u => String(u.id) === String(user.id));
  if (found) setApprovalData({ status: found.verification_status, submitted_at: found.created_at, rejection_reason: found.rejection_reason });
    } catch (error) {
      console.error('Error fetching approval data:', error);
    }
  };

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      // Fetch documents for this user
      const data = await AdminApi.documents({ entity_type: 'user', entity_id: user.id });
      const list = Array.isArray(data)
        ? data
        : (data && typeof data === 'object' && 'items' in (data as any) && Array.isArray((data as any).items)
            ? (data as any).items
            : []);
      setDocuments(list as any[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Use AdminApi helper which attempts API-key fetch first and falls back in dev.
      const res = await AdminApi.approveUser(user.id);
      const licenseNumber = (res as any)?.license_number as string | undefined;
      toast.success(`${user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)} approved successfully!${licenseNumber ? ` License number: ${licenseNumber}` : ''}`);

      // Non-blocking approval email via Admin API helper
      try {
        const subject = 'Your Home & Own account has been approved';
        const html = `<p>Hi ${user.first_name},</p><p>Your ${user.user_type} account has been approved.${licenseNumber ? ` License: <strong>${licenseNumber}</strong>.` : ''}</p>`;
        await AdminApi.doAdminFetch('/api/emails/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: user.email, subject, html }) });
      } catch (e) {
        console.warn('Failed to send approval email (non-blocking):', e);
      }

      onApprovalChange();
      onClose();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Send resend email via Admin API
      const subject = `Account Verification Required - ${user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)} Registration`;
      const html = `
        <h2>Account Verification Required</h2>
        <p>Hi ${user.first_name},</p>
        <p>Your ${user.user_type} account registration is pending admin approval. Please ensure you have uploaded all required documents.</p>
        <p>Our team will review your application and contact you within 24-48 hours.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you for choosing Home & Own!</p>
      `;
      
      await AdminApi.doAdminFetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: subject,
          html: html
        })
      });
      
      toast.success('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    try {
      await AdminApi.rejectUser(user.id, rejectionReason.trim());
      toast.success('User application rejected');
      // Non-blocking rejection email
      try {
        const subject = 'Your Home & Own application was rejected';
        const html = `<p>Hi ${user.first_name},</p><p>We’re sorry to inform you that your application was rejected.</p><p>Reason: ${rejectionReason.trim()}</p>`;
        await AdminApi.doAdminFetch('/api/emails/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: user.email, subject, html }) });
      } catch (e) {
        console.warn('Failed to send rejection email (non-blocking):', e);
      }
      onApprovalChange();
      onClose();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)} Application Review
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{user.first_name} {user.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-sm text-gray-900">{user.phone_number || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User Type</label>
                <p className="text-sm text-gray-900 capitalize">{user.user_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Status</label>
                <p className={`text-sm font-medium ${
                  user.verification_status === 'pending' ? 'text-yellow-600' :
                  user.verification_status === 'verified' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {user.verification_status}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          {userProfile && user.user_type === 'agent' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience Years</label>
                  <p className="text-sm text-gray-900">{userProfile.experience_years || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <p className="text-sm text-gray-900">{userProfile.specialization || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Education Background</label>
                  <p className="text-sm text-gray-900">{userProfile.education_background || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <p className="text-sm text-gray-900">{userProfile.bio || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}

          {userProfile && user.user_type === 'seller' && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Seller Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <p className="text-sm text-gray-900">{userProfile.business_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Type</label>
                  <p className="text-sm text-gray-900">{userProfile.business_type || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Approval Status */}
          {approvalData && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submitted At</label>
                  <p className="text-sm text-gray-900">
                    {new Date(approvalData.submitted_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className={`text-sm font-medium ${
                    approvalData.status === 'pending' ? 'text-yellow-600' :
                    approvalData.status === 'approved' ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {approvalData.status}
                  </p>
                </div>
                {approvalData.rejection_reason && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                    <p className="text-sm text-red-600">{approvalData.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submitted Documents */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submitted Documents</h3>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-600">No documents uploaded.</p>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{doc.document_category || 'document'} • {new Date(doc.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const url = FilesApi.publicUrlById(doc.id);
                            window.open(url, '_blank');
                          } catch (e) {
                            console.error('Open failed:', e);
                          }
                        }}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >View</button>
                      <button
                        onClick={async () => {
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
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >Download</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          {user.verification_status === 'pending' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (optional)
                </label>
                <textarea
                  id="rejectionReason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide reason if rejecting application..."
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle size={20} />
                  {loading ? 'Processing...' : 'Approve Application'}
                </button>
                
                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Mail size={20} />
                  {loading ? 'Sending...' : 'Resend Email'}
                </button>
                
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle size={20} />
                  {loading ? 'Processing...' : 'Reject Application'}
                </button>
              </div>
            </div>
          )}

          {user.verification_status !== 'pending' && (
            <div className={`rounded-lg p-4 ${
              user.verification_status === 'verified' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <p className="font-medium">
                This application has been {user.verification_status === 'verified' ? 'approved' : 'rejected'}.
              </p>
              {user.agent_license_number && (
                <p className="text-sm mt-1">
                  License Number: <strong>{user.agent_license_number}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserApprovalModal;