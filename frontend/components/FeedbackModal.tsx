// Feedback Modal Component
'use client';

import { useState } from 'react';
import { submitFeedback, logUsabilityMetric } from '@/lib/evaluation';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    triggerAfterTask?: boolean;
}

const CATEGORIES = [
    { value: 'usability', label: 'Usability', icon: '🔧' },
    { value: 'effectiveness', label: 'Effectiveness', icon: '✅' },
    { value: 'productivity', label: 'Productivity', icon: '📈' },
    { value: 'stress', label: 'Stress Reduction', icon: '🧘' },
    { value: 'overall', label: 'Overall Experience', icon: '⭐' },
];

const QUICK_FEEDBACK = [
    { label: 'Love it!', emoji: '😍', color: 'bg-green-500' },
    { label: 'Could be better', emoji: '🤔', color: 'bg-yellow-500' },
    { label: 'Issues', emoji: '😟', color: 'bg-red-500' },
];

export default function FeedbackModal({ isOpen, onClose, triggerAfterTask }: FeedbackModalProps) {
    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState<string>('overall');
    const [comment, setComment] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [selectedQuick, setSelectedQuick] = useState<number | null>(null);

    const handleSubmit = async () => {
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            await submitFeedback(rating, category, comment);

            // Log usability metric for productivity feedback
            if (triggerAfterTask) {
                await logUsabilityMetric('productivity_score', rating * 20);
            }

            setSubmitted(true);
            setTimeout(() => {
                onClose();
                resetForm();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setRating(0);
        setCategory('overall');
        setComment('');
        setSubmitted(false);
        setSelectedQuick(null);
    };

    const handleQuickFeedback = (index: number) => {
        setSelectedQuick(index);
        setRating(index === 0 ? 5 : index === 1 ? 3 : 1);
        setCategory('overall');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {submitted ? 'Thank You! 🙏' : 'Share Your Feedback'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {submitted
                            ? 'Your feedback helps us improve'
                            : 'Help us make the system better for you'}
                    </p>
                </div>

                {/* Content */}
                {submitted ? (
                    <div className="p-8 text-center">
                        <div className="text-6xl mb-4">✨</div>
                        <p className="text-gray-600">We appreciate your feedback!</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Quick Feedback Buttons */}
                        <div className="flex gap-2 justify-center">
                            {QUICK_FEEDBACK.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleQuickFeedback(index)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedQuick === index
                                            ? `${item.color} text-white scale-105`
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <span className="mr-1">{item.emoji}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Star Rating */}
                        <div className="text-center">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rate your experience
                            </label>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                                        aria-label={`Rate ${star} stars`}
                                    >
                                        {(hoveredRating || rating) >= star ? '⭐' : '☆'}
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                {rating === 1 && 'Poor'}
                                {rating === 2 && 'Fair'}
                                {rating === 3 && 'Good'}
                                {rating === 4 && 'Very Good'}
                                {rating === 5 && 'Excellent'}
                            </p>
                        </div>

                        {/* Category Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategory(cat.value)}
                                        className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${category === cat.value
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span className="mr-1">{cat.icon}</span>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional comments (optional)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us more about your experience..."
                                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                {!submitted && (
                    <div className="p-6 border-t border-gray-100 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={rating === 0 || isSubmitting}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${rating === 0 || isSubmitting
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
