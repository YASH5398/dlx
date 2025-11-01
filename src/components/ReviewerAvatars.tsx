import { useState } from 'react';
import { useReviewPreview } from '../hooks/useReviewPreview';

interface ReviewerAvatarsProps {
  serviceId: string;
  onClick: () => void;
  className?: string;
}

export default function ReviewerAvatars({ serviceId, onClick, className = '' }: ReviewerAvatarsProps) {
  const { reviewers, loading } = useReviewPreview(serviceId);

  // If no reviewers yet, show placeholder circles
  if (loading || reviewers.length === 0) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center transition-all hover:scale-105 ${className}`}
        aria-label="View Reviews"
      >
        <div className="flex -space-x-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full bg-slate-600/50 border-2 border-slate-800 animate-pulse"
            />
          ))}
        </div>
      </button>
    );
  }

  // Show up to 4 reviewers
  const displayReviewers = reviewers.slice(0, 4);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (reviewerId: string) => {
    setFailedImages((prev) => new Set(prev).add(reviewerId));
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center transition-all hover:scale-105 ${className}`}
      aria-label="View Reviews"
    >
      <div className="flex -space-x-2">
        {displayReviewers.map((reviewer, index) => {
          const showInitial = !reviewer.avatar || failedImages.has(reviewer.id);
          return (
            <div
              key={reviewer.id}
              className="w-7 h-7 rounded-full border-2 border-slate-800 overflow-hidden bg-slate-700 shadow-md hover:z-10 hover:scale-110 transition-all"
              style={{ zIndex: displayReviewers.length - index }}
            >
              {showInitial ? (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-slate-600 to-slate-500">
                  {reviewer.name.slice(0, 1).toUpperCase()}
                </div>
              ) : (
                <img
                  src={reviewer.avatar}
                  alt={reviewer.name}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(reviewer.id)}
                />
              )}
            </div>
          );
        })}
      </div>
    </button>
  );
}

