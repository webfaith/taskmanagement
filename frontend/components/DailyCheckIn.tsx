// Daily Check-in Widget Component
'use client';

import { useState } from 'react';
import { submitDailyCheckIn } from '@/lib/evaluation';

interface DailyCheckInProps {
    onComplete?: () => void;
}

const MOODS = [
    { emoji: '😊', label: 'Great', value: 'great' },
    { emoji: '😐', label: 'Okay', value: 'okay' },
    { emoji: '😓', label: 'Stressed', value: 'stressed' },
    { emoji: '😡', label: 'Overwhelmed', value: 'overwhelmed' },
];

export default function DailyCheckIn({ onComplete }: DailyCheckInProps) {
    const [mood, setMood] = useState<string | null>(null);
    const [energyLevel, setEnergyLevel] = useState(5);
    const [stressLevel, setStressLevel] = useState(5);
    const [productivityRating, setProductivityRating] = useState(5);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [tip, setTip] = useState<string | null>(null);

    const getTip = (mood: string, stress: number): string => {
        if (mood === 'overwhelmed' || stress > 7) {
            return '💡 Tip: Try breaking your tasks into smaller chunks and take short breaks between them.';
        }
        if (mood === 'stressed') {
            return '💡 Tip: Consider adding a 15-minute mindfulness session to your schedule.';
        }
        if (stress < 4) {
            return '💡 Tip: Great stress management! Keep up your balanced routine.';
        }
        return '💡 Tip: Remember to stay hydrated and take regular breaks for optimal productivity.';
    };

    const handleSubmit = async () => {
        if (!mood) return;

        setIsSubmitting(true);
        try {
            await submitDailyCheckIn({
                mood: mood as '😊' | '😐' | '😓' | '😡',
                energy_level: energyLevel,
                stress_level: stressLevel,
                productivity_rating: productivityRating,
                notes: notes || undefined,
            });

            setTip(getTip(mood, stressLevel));
            setSubmitted(true);

            setTimeout(() => {
                onComplete?.();
            }, 3000);
        } catch (error) {
            console.error('Failed to submit daily check-in:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                <div className="text-center">
                    <div className="text-6xl mb-4">🌟</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Check-in Complete!</h3>
                    <p className="text-gray-600 mb-4">Thanks for sharing how you're doing today.</p>
                    {tip && (
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <p className="text-blue-700 text-sm">{tip}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Daily Check-in</h3>
            <p className="text-sm text-gray-500 mb-6">How are you doing today?</p>

            {/* Mood Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    How's your mood?
                </label>
                <div className="flex justify-between gap-2">
                    {MOODS.map((m) => (
                        <button
                            key={m.value}
                            onClick={() => setMood(m.value)}
                            className={`flex-1 py-3 rounded-xl text-center transition-all duration-200 ${mood === m.value
                                    ? 'bg-blue-500 text-white scale-105 shadow-lg'
                                    : 'bg-white text-gray-600 hover:bg-blue-50'
                                }`}
                            aria-label={m.label}
                        >
                            <span className="text-3xl block">{m.emoji}</span>
                            <span className="text-xs mt-1 font-medium">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Energy Level */}
            <div className="mb-6">
                <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Energy Level</label>
                    <span className="text-sm text-blue-600 font-medium">{energyLevel}/10</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Low</span>
                    <span>High</span>
                </div>
            </div>

            {/* Stress Level */}
            <div className="mb-6">
                <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Stress Level</label>
                    <span className={`text-sm font-medium ${stressLevel > 7 ? 'text-red-500' : stressLevel > 4 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                        {stressLevel}/10
                    </span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-${stressLevel > 7 ? 'red' : stressLevel > 4 ? 'yellow' : 'green'
                        }-500`}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Calm</span>
                    <span>Stressed</span>
                </div>
            </div>

            {/* Productivity Rating */}
            <div className="mb-6">
                <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Productivity Today</label>
                    <span className="text-sm text-blue-600 font-medium">{productivityRating}/10</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={productivityRating}
                    onChange={(e) => setProductivityRating(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            {/* Quick Notes */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick notes (optional)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any thoughts about today..."
                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={2}
                />
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!mood || isSubmitting}
                className={`w-full py-3 rounded-xl font-medium transition-all ${!mood || isSubmitting
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                    }`}
            >
                {isSubmitting ? 'Saving...' : 'Complete Check-in'}
            </button>
        </div>
    );
}
