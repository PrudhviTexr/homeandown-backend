import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RecordsApi } from '@/services/pyApi';
import { useAuth } from '@/contexts/AuthContext';

interface ScheduleViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number | null;
  agentId?: number | null;
  onScheduled?: () => void;
}

const ScheduleViewingModal: React.FC<ScheduleViewingModalProps> = ({ isOpen, onClose, propertyId, agentId, onScheduled }) => {
  const { user } = useAuth();
  const [datetime, setDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !propertyId) return null;

  const submit = async () => {
    if (!datetime) return;
    setLoading(true);
    try {
      await RecordsApi.createViewing({ property_id: propertyId, user_id: user?.id, agent_id: agentId || undefined, scheduled_at: new Date(datetime).toISOString(), notes });
      onScheduled && onScheduled();
      onClose();
      setDatetime(''); setNotes('');
    } catch (e) { console.warn(e); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Schedule Viewing</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring" rows={3} />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
            <button disabled={loading || !datetime} onClick={submit} className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50">{loading ? 'Saving...' : 'Schedule'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleViewingModal;
