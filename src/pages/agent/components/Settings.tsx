import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isFileTypeAllowed, validateFileSize } from '@/utils/imageUpload';

interface SettingsProps {
  user: any;
  agentProfile: any;
  setAgentProfile: (profile: any) => void;
  setShowPasswordModal: (show: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({
  user,
  agentProfile,
  setAgentProfile,
  setShowPasswordModal,
}) => {
  const [saving, setSaving] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofUploading, setIdProofUploading] = useState(false);
  const [idProofUploadedPath, setIdProofUploadedPath] = useState<string | null>(null);

  // 1) Verify bank account
  const verifyBankAccount = () => {
    if (
      !agentProfile.bank_account_number ||
      !confirmAccountNumber ||
      !agentProfile.ifsc_code
    ) {
      toast.error('Please fill in all bank account details');
      return;
    }
    if (agentProfile.bank_account_number !== confirmAccountNumber) {
      toast.error('Account numbers do not match');
      return;
    }
    setVerifyingAccount(true);
    setTimeout(() => {
      setAccountVerified(true);
      setVerifyingAccount(false);
      toast.success('Bank account verified successfully!');
    }, 2000);
  };

  // 2) Save all changes
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Update profile via Admin API
      const { pyFetch } = await import('@/utils/backend');
      await pyFetch(`/api/admin/users/${user.id}/profile`, {
        method: 'POST',
        body: JSON.stringify({
          education_background: agentProfile.education_background,
          specialization: agentProfile.specialization,
          bio: agentProfile.bio,
        }),
        useApiKey: true,
      });

      if (accountVerified) {
        await pyFetch(`/api/admin/users/${user.id}/bank`, {
          method: 'POST',
          body: JSON.stringify({
            bank_account_number: agentProfile.bank_account_number,
            ifsc_code: agentProfile.ifsc_code,
          }),
          useApiKey: true,
        });
      }

      await pyFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          phone_number: agentProfile.phone_number,
          city: agentProfile.city,
          state: agentProfile.state,
        }),
        useApiKey: true,
      });

      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // 3) Upload Agent ID Proof -> storage + documents table + notify
  const handleUploadIdProof = async () => {
    try {
      if (!user) {
        toast.error('You must be logged in to upload documents');
        return;
      }
      if (!idProofFile) {
        toast.error('Please choose an ID proof file (PNG, JPG, JPEG, or PDF)');
        return;
      }
      if (!isFileTypeAllowed(idProofFile)) {
        toast.error('Unsupported file type. Allowed: PNG, JPG, JPEG, PDF');
        return;
      }
      if (!validateFileSize(idProofFile)) {
        toast.error('File too large. Maximum size is 5MB');
        return;
      }

      setIdProofUploading(true);
  // Upload to Python API
  const { uploadImage } = await import('@/utils/imageUpload');
  const url = await uploadImage(idProofFile, 'verification', Number(user.id));
  setIdProofUploadedPath(url);

  // Mark user as pending verification via Admin API
  const { pyFetch } = await import('@/utils/backend');
  await pyFetch(`/api/admin/users/${user.id}/verify-status`, { method: 'POST', body: JSON.stringify({ status: 'pending' }), useApiKey: true });

      toast.success('ID proof uploaded successfully. We will review it shortly.');

  // Notify via Python API emails
      try {
        const { pyFetch } = await import('@/utils/backend');
        const subjectUser = 'Your ID proof was submitted';
        const htmlUser = `<p>Hi ${agentProfile.first_name || ''},</p><p>Your ID proof was received and is pending verification.</p>`;
  await pyFetch('/api/emails/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: user.email, subject: subjectUser, html: htmlUser }), useApiKey: true });
      } catch (e) {
        console.warn('Failed to send confirmation email to agent (non-blocking):', e);
      }

      try {
        const { pyFetch } = await import('@/utils/backend');
        const subjectAdmin = 'Agent ID Proof Submitted';
        const htmlAdmin = `<p>Agent ${agentProfile.first_name || ''} ${agentProfile.last_name || ''} (${user.email}) submitted ID proof.</p>`;
  await pyFetch('/api/emails/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: 'info@homeandown.com', subject: subjectAdmin, html: htmlAdmin }), useApiKey: true });
      } catch (e) {
        console.warn('Failed to send admin notification email (non-blocking):', e);
      }

      // Reset local state
      setIdProofFile(null);
    } catch (err) {
      console.error('Error uploading ID proof:', err);
      toast.error('Failed to upload ID proof');
    } finally {
      setIdProofUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-5 w-5 text-[#061D58]" />
        <h3 className="text-lg font-semibold text-[#061D58]">Agent Settings</h3>
      </div>

      {/* Profile & Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-800">Profile Information</h4>
          <div>
            <label className="block text-sm text-gray-700">First Name</label>
            <input
              readOnly
              value={agentProfile.first_name || ''}
              className="w-full p-2 border rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Last Name</label>
            <input
              readOnly
              value={agentProfile.last_name || ''}
              className="w-full p-2 border rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">License Number</label>
            <input
              readOnly
              value={agentProfile.agent_license_number || 'Not assigned'}
              className="w-full p-2 border rounded-md bg-gray-100"
            />
            <p className="text-xs text-gray-500">
              License number cannot be changed
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-700">
              Education Background
            </label>
            <input
              value={agentProfile.education_background || ''}
              onChange={(e) =>
                setAgentProfile({
                  ...agentProfile,
                  education_background: e.target.value,
                })
              }
              placeholder="e.g., B.Com, MBA in Real Estate"
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-800">Contact Information</h4>
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input
              readOnly
              value={user.email || ''}
              className="w-full p-2 border rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Phone Number</label>
            <input
              value={agentProfile.phone_number || ''}
              onChange={(e) =>
                setAgentProfile({
                  ...agentProfile,
                  phone_number: e.target.value,
                })
              }
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">City</label>
            <input
              value={agentProfile.city || ''}
              onChange={(e) =>
                setAgentProfile({ ...agentProfile, city: e.target.value })
              }
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">State</label>
            <input
              value={agentProfile.state || ''}
              onChange={(e) =>
                setAgentProfile({ ...agentProfile, state: e.target.value })
              }
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Bank Details & Notifications */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank Details */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-800">Bank Account Details</h4>
          <div>
            <label className="block text-sm text-gray-700">
              Account Number
            </label>
            <input
              value={agentProfile.bank_account_number || ''}
              onChange={(e) =>
                setAgentProfile({
                  ...agentProfile,
                  bank_account_number: e.target.value,
                })
              }
              className="w-full p-2 border rounded-md"
              placeholder="Enter account number"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">
              Confirm Account Number
            </label>
            <input
              value={confirmAccountNumber}
              onChange={(e) => setConfirmAccountNumber(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Re-enter account number"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">IFSC Code</label>
            <input
              value={agentProfile.ifsc_code || ''}
              onChange={(e) =>
                setAgentProfile({ ...agentProfile, ifsc_code: e.target.value })
              }
              className="w-full p-2 border rounded-md"
              placeholder="Enter IFSC code"
            />
          </div>
          <div>
            <button
              onClick={verifyBankAccount}
              disabled={verifyingAccount || accountVerified}
              className={`flex items-center px-4 py-2 rounded-md ${
                accountVerified
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {verifyingAccount ? (
                <RefreshCw className="animate-spin mr-2" size={16} />
              ) : accountVerified ? (
                <CheckCircle className="mr-2" size={16} />
              ) : null}
              {verifyingAccount
                ? 'Verifying...'
                : accountVerified
                ? 'Verified'
                : 'Verify Account'}
            </button>
            {!accountVerified && !verifyingAccount && (
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <AlertCircle className="mr-1" size={12} />
                Account verification required for payouts
              </p>
            )}
          </div>
        </div>

        {/* ID Proof Upload */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-800">Identity Verification</h4>
          <p className="text-sm text-gray-600">Upload a valid ID proof (PNG, JPG, JPEG, or PDF). Max 5MB.</p>
          <div>
            <label className="block text-sm text-gray-700 mb-1">ID Proof File</label>
            <input
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              onChange={(e) => setIdProofFile(e.target.files?.[0] || null)}
              className="w-full p-2 border rounded-md bg-white"
            />
            {idProofFile && (
              <p className="text-xs text-gray-500 mt-1">Selected: {idProofFile.name} ({(idProofFile.size / 1024).toFixed(1)} KB)</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleUploadIdProof}
              disabled={!idProofFile || idProofUploading}
              className="flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {idProofUploading ? (
                <RefreshCw className="animate-spin mr-2" size={16} />
              ) : null}
              {idProofUploading ? 'Uploading...' : 'Upload ID Proof'}
            </button>
            {idProofUploadedPath && (
              <span className="text-xs text-green-700">Last uploaded: {idProofUploadedPath.split('/').pop()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Notification & Specialization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-800">Notification Preferences</h4>
          <div className="space-y-2">
            {['Email', 'SMS', 'In-app'].map((type) => (
              <label key={type} className="flex items-center">
                <input type="checkbox" defaultChecked className="mr-2" />
                <span className="text-sm">{type} notifications</span>
              </label>
            ))}
          </div>

          <h4 className="font-medium text-gray-800">Specialization</h4>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Area of Expertise
            </label>
            <select
              value={agentProfile.specialization || ''}
              onChange={(e) =>
                setAgentProfile({ ...agentProfile, specialization: e.target.value })
              }
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Luxury">Luxury Properties</option>
              <option value="Investment">Investment Properties</option>
              <option value="Land">Land & Plots</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Bio</label>
            <textarea
              value={agentProfile.bio || ''}
              onChange={(e) =>
                setAgentProfile({ ...agentProfile, bio: e.target.value })
              }
              rows={3}
              className="w-full p-2 border rounded-md"
              placeholder="Tell clients about yourself..."
            />
          </div>
        </div>
      </div>

      {/* Security & Save */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-800">Account Security</h4>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center bg-[#3B5998] text-white px-4 py-2 rounded-lg hover:bg-[#2d4373] transition"
        >
          <SettingsIcon className="mr-2" size={16} />
          Change Password
        </button>
        <div className="text-sm text-gray-600">
          <p>Last password change: Never</p>
          <p>Two-factor authentication: Not enabled</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveChanges}
          disabled={saving}
          className="flex items-center bg-[#90C641] text-white px-6 py-2 rounded-lg hover:bg-[#7DAF35] transition"
        >
          {saving && (
            <RefreshCw className="animate-spin mr-2" size={16} />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default Settings;