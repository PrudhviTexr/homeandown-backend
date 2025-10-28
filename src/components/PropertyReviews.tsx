import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/utils/backend';

interface PropertyReview {
  id: string;
  user_id: string;
  property_id: string;
  rating: number;
  title?: string;
  comment: string;
  helpful_count?: number;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

interface PropertyReviewsProps {
  propertyId: string;
}

const PropertyReviews: React.FC<PropertyReviewsProps> = ({ propertyId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Review form state
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadReviews();
  }, [propertyId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        getApiUrl(`/api/properties/${propertyId}/reviews`)
      );
      if (response.ok) {
        const data = await response.json();
        setReviews(data || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        getApiUrl(`/api/properties/${propertyId}/reviews`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating,
            title,
            comment,
            user_id: user.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      setRating(0);
      setTitle('');
      setComment('');
      setShowReviewForm(false);
      loadReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-2xl font-bold text-[#162e5a] mb-4">Property Reviews</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Overall Rating */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
            <div className="text-5xl font-bold text-[#162e5a] mb-2">{averageRating}</div>
            <div className="flex items-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(parseFloat(averageRating))
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{stars}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 w-12 text-right">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        {user && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="mt-6 w-full bg-[#0ca5e9] text-white py-3 rounded-lg hover:bg-[#0890cb] transition-colors font-semibold"
          >
            Write a Review
          </button>
        )}

        {!user && (
          <div className="mt-6 text-center text-gray-600">
            Please <a href="/login" className="text-[#0ca5e9] hover:underline">login</a> to write a review
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h4 className="text-xl font-bold text-[#162e5a] mb-4">Write Your Review</h4>
          
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        (hover || rating) >= star
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    {rating} {rating === 1 ? 'star' : 'stars'}
                  </span>
                )}
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ca5e9]"
                maxLength={100}
              />
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this property..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ca5e9]"
                rows={5}
                maxLength={1000}
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                {comment.length}/1000 characters
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || rating === 0 || !comment.trim()}
                className="flex-1 bg-[#0ca5e9] text-white py-3 rounded-lg hover:bg-[#0890cb] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setRating(0);
                  setTitle('');
                  setComment('');
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-[#0ca5e9] rounded-full mx-auto"></div>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg p-6 shadow-md">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 bg-[#0ca5e9] text-white rounded-full flex items-center justify-center font-semibold">
                      {review.user?.first_name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {review.user
                          ? `${review.user.first_name} ${review.user.last_name}`
                          : 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Title */}
              {review.title && (
                <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
              )}

              {/* Review Comment */}
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>

              {/* Review Actions */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#0ca5e9] transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Helpful {review.helpful_count ? `(${review.helpful_count})` : ''}</span>
                </button>
                <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#0ca5e9] transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg p-12 text-center shadow-md">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-700 mb-2">No reviews yet</h4>
            <p className="text-gray-600">Be the first to review this property!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyReviews;
