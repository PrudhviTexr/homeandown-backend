import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { RecordsApi } from '@/services/pyApi';
import { useAuth } from '@/contexts/AuthContext';

interface AgentReviewWidgetProps {
  agentId: number;
  propertyId?: number;
}

const AgentReviewWidget: React.FC<AgentReviewWidgetProps> = ({ agentId, propertyId }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const load = async () => {
    try {
      const data = await RecordsApi.listAgentReviews(agentId);
      setReviews(data || []);
    } catch {}
  };
  useEffect(() => { load(); }, [agentId]);

  const submit = async () => {
    if (!user) return;
    if (rating < 1) return;
    setSubmitting(true);
    try {
      await RecordsApi.createAgentReview({ agent_id: agentId, reviewer_user_id: user.id, property_id: propertyId, rating, comment });
      setRating(0); setComment('');
      await load();
    } catch (e) { console.warn(e); }
    setSubmitting(false);
  };

  const average = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800">Agent Reviews</h4>
        {average && <span className="text-sm text-gray-600">Avg {average} / 5 ({reviews.length})</span>}
      </div>
      <div className="flex items-center space-x-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} className="focus:outline-none">
            <Star className={`h-5 w-5 ${ (hover || rating) >= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience with this agent" className="w-full border rounded p-2 text-sm focus:outline-none focus:ring" rows={3} />
      <button disabled={submitting || !user || rating < 1} onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm">Submit Review</button>
      <div className="space-y-3 pt-2 max-h-48 overflow-y-auto">
        {reviews.map(r => (
          <div key={r.id} className="border rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1">
                {Array.from({ length: r.rating }).map((_,i) => <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />)}
              </div>
              <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.comment && <p className="text-xs text-gray-700 leading-snug">{r.comment}</p>}
          </div>
        ))}
        {!reviews.length && <p className="text-xs text-gray-500">No reviews yet.</p>}
      </div>
    </div>
  );
};

export default AgentReviewWidget;
