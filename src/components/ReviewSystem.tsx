import React, { useState } from 'react';
import { X, Star, ChevronDown } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar: string;
}

interface ReviewSystemProps {
  serviceName: string;
  reviews: Review[];
  isOpen: boolean;
  onClose: () => void;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({ serviceName, reviews, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="relative bg-slate-900 rounded-t-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
              <p className="text-slate-400 mt-1">{serviceName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>
          
          {/* Average Rating */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-2xl font-bold text-white">4.8</span>
            <span className="text-slate-400">({reviews.length} reviews)</span>
          </div>
        </div>

        {/* Reviews List */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  
                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white text-lg">{review.name}</h4>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < Math.floor(review.rating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-slate-600'
                            }`} 
                          />
                        ))}
                        <span className="text-slate-400 text-sm ml-2">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{review.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSystem;
