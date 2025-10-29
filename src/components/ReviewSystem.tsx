import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useReviews } from '../hooks/useReviews';

interface ReviewSystemProps {
  serviceId: string | null;
  serviceName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({ serviceId, serviceName, isOpen, onClose }) => {
  const {
    reviews,
    averageRating,
    realReviewsCount,
    loading,
    error,
    canWriteReview,
    submitting,
    submitReview,
  } = useReviews(serviceId, serviceName);

  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setFormError(null);
    try {
      await submitReview(rating, text);
      setText('');
      setRating(5);
    } catch (e: any) {
      setFormError(e?.message || 'Failed to submit review');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="relative bg-slate-900 rounded-t-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
              <p className="text-slate-400 mt-1">{serviceName}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          {/* Average Rating */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-slate-600'} fill-current`} />
              ))}
            </div>
            <span className="text-2xl font-bold text-white">{averageRating.toFixed(1)}</span>
            <span className="text-slate-400">({realReviewsCount} real)</span>
          </div>

          {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        </div>

        {/* Reviews List */}
        <div className="overflow-y-auto max-h-[60vh] p-6 space-y-6">
          {loading && <div className="text-slate-400">Loading reviews…</div>}
          {!loading && reviews.length === 0 && (
            <div className="text-slate-400">No reviews yet. Be the first to review.</div>
          )}

          {!loading && reviews.map((review) => (
            <div key={review.id} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <img src={review.avatar} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
                </div>
                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white text-lg">{review.name}</h4>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(review.rating) ? 'text-yellow-400' : 'text-slate-600'} fill-current`} />
                      ))}
                      <span className="text-slate-400 text-sm ml-2">{review.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{review.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submission */}
        {canWriteReview && (
          <div className="border-t border-slate-700 p-6 bg-slate-900/80">
            <h3 className="text-white font-semibold mb-3">Write a Review</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full sm:w-32 px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-200"
              >
                {[5, 4.5, 4, 3.5, 3].map((r) => (
                  <option key={r} value={r}>{r.toFixed(1)} ★</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Share your experience…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-200"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
            {formError && <div className="text-red-400 text-sm mt-2">{formError}</div>}
            <div className="text-slate-500 text-xs mt-2">Only available after a successful order.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSystem;
