import { useState, useMemo } from 'react';

export interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar: string;
}

const REVIEW_AVATARS = [
  '/assets/reviewers/avatar1.svg',
  '/assets/reviewers/avatar2.svg',
  '/assets/reviewers/avatar3.svg',
  '/assets/reviewers/avatar4.svg',
];

const REVIEW_TEXTS = [
  "Outstanding app! Helped boost my affiliate business 🚀",
  "Perfectly managed system, Digi Linex support is awesome 💪",
  "Very professional service, increased my online sales significantly 💼",
  "Flawless experience, 5-star for the team 🌟",
  "Amazing results! My business growth has been incredible 📈",
  "Top-notch quality and excellent customer support 🎯",
  "Exceeded expectations, highly recommend to everyone ⭐",
  "Game-changer for my business, worth every penny 💎",
  "Outstanding service delivery and communication 🔥",
  "Professional team, delivered exactly what was promised ✨",
  "Incredible value for money, transformed my business 🚀",
  "Best decision I made for my business growth 💯",
  "Exceptional quality and attention to detail 🎨",
  "Outstanding support team, always available to help 🤝",
  "Perfect implementation, exceeded all expectations 🏆",
  "Amazing experience from start to finish 🌟",
  "Highly professional and reliable service 💪",
  "Game-changing solution for my business needs 🚀",
  "Outstanding results, highly recommend! ⭐",
  "Perfect execution and excellent communication 💼"
];

const REVIEWER_NAMES = [
  "Sarah Johnson",
  "Michael Chen",
  "Emily Rodriguez",
  "David Thompson",
  "Lisa Wang",
  "James Wilson",
  "Maria Garcia",
  "Robert Brown",
  "Jennifer Lee",
  "Christopher Davis",
  "Amanda Taylor",
  "Daniel Martinez",
  "Jessica Anderson",
  "Matthew White",
  "Ashley Thomas",
  "Ryan Jackson",
  "Nicole Harris",
  "Kevin Moore",
  "Stephanie Clark",
  "Brandon Lewis"
];

export const useReviews = (serviceName: string) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const reviews = useMemo(() => {
    // Generate 12-18 random reviews
    const reviewCount = Math.floor(Math.random() * 7) + 12; // 12-18 reviews
    const generatedReviews: Review[] = [];

    for (let i = 0; i < reviewCount; i++) {
      const randomName = REVIEWER_NAMES[Math.floor(Math.random() * REVIEWER_NAMES.length)];
      const randomText = REVIEW_TEXTS[Math.floor(Math.random() * REVIEW_TEXTS.length)];
      const randomAvatar = REVIEW_AVATARS[Math.floor(Math.random() * REVIEW_AVATARS.length)];
      const randomRating = Math.random() * 0.5 + 4.5; // 4.5-5.0 rating

      generatedReviews.push({
        id: `review-${i}`,
        name: randomName,
        text: randomText,
        rating: Math.round(randomRating * 10) / 10, // Round to 1 decimal
        avatar: randomAvatar,
      });
    }

    return generatedReviews;
  }, [serviceName]);

  const openReviewModal = () => setIsReviewModalOpen(true);
  const closeReviewModal = () => setIsReviewModalOpen(false);

  return {
    reviews,
    isReviewModalOpen,
    openReviewModal,
    closeReviewModal,
  };
};
