// Success Stories Page
'use client';

import { useState, useEffect } from 'react';
import { getSuccessStories, submitSuccessStory } from '@/lib/evaluation';
import { SuccessStory } from '@/types/evaluation';

export default function SuccessStoriesPage() {
    const [stories, setStories] = useState<SuccessStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newStory, setNewStory] = useState({
        story: '',
        productivity_before: 0,
        productivity_after: 0,
        tips: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadStories();
    }, []);

    const loadStories = async () => {
        try {
            const data = await getSuccessStories();
            setStories(data);
        } catch (error) {
            console.error('Failed to load stories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!newStory.story || newStory.productivity_before === 0 || newStory.productivity_after === 0) return;

        setIsSubmitting(true);
        try {
            const story = await submitSuccessStory({
                story: newStory.story,
                productivity_before: newStory.productivity_before,
                productivity_after: newStory.productivity_after,
                tips: newStory.tips.split(',').map(t => t.trim()).filter(Boolean),
            });
            setStories([story, ...stories]);
            setShowForm(false);
            setNewStory({ story: '', productivity_before: 0, productivity_after: 0, tips: '' });
        } catch (error) {
            console.error('Failed to submit story:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getImprovement = (before: number, after: number) => {
        return ((after - before) / before * 100).toFixed(0);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Success Stories</h1>
                    <p className="text-gray-500">Learn from other students' experiences</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                    {showForm ? 'Cancel' : 'Share Your Story'}
                </button>
            </div>

            {/* Submit Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Share Your Success Story</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Story</label>
                            <textarea
                                value={newStory.story}
                                onChange={(e) => setNewStory({ ...newStory, story: e.target.value })}
                                placeholder="Tell us how the task management system helped you..."
                                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Productivity Before (1-10)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={newStory.productivity_before}
                                    onChange={(e) => setNewStory({ ...newStory, productivity_before: parseInt(e.target.value) })}
                                    className="w-full p-3 border border-gray-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Productivity After (1-10)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={newStory.productivity_after}
                                    onChange={(e) => setNewStory({ ...newStory, productivity_after: parseInt(e.target.value) })}
                                    className="w-full p-3 border border-gray-200 rounded-lg"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Tips (comma-separated)</label>
                            <input
                                type="text"
                                value={newStory.tips}
                                onChange={(e) => setNewStory({ ...newStory, tips: e.target.value })}
                                placeholder="Break tasks into smaller chunks, Use the calendar feature..."
                                className="w-full p-3 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !newStory.story}
                            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Story'}
                        </button>
                    </div>
                </div>
            )}

            {/* Stories List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading stories...</p>
                </div>
            ) : stories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">📖</div>
                    <p className="text-gray-500 mb-4">No success stories yet</p>
                    <p className="text-sm text-gray-400">Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {stories.map((story) => (
                        <div key={story.id} className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {story.anonymous_id.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="font-medium text-gray-800">Student {story.anonymous_id}</span>
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
                                            +{getImprovement(story.productivity_before, story.productivity_after)}% improvement
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-4">{story.story}</p>
                                    {story.tips.length > 0 && (
                                        <div className="bg-blue-50 rounded-xl p-4">
                                            <p className="text-sm font-medium text-blue-800 mb-2">💡 Tips from this student:</p>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                {story.tips.map((tip, i) => (
                                                    <li key={i}>• {tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Before/After Stats */}
            {stories.length > 0 && (
                <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Community Impact</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">
                                +{Math.round(stories.reduce((acc, s) => acc + ((s.productivity_after - s.productivity_before) / s.productivity_before * 100), 0) / stories.length)}%
                            </p>
                            <p className="text-sm text-gray-500">Average Improvement</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{stories.length}</p>
                            <p className="text-sm text-gray-500">Stories Shared</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-purple-600">
                                {stories.reduce((acc, s) => acc + s.tips.length, 0)}
                            </p>
                            <p className="text-sm text-gray-500">Tips Shared</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
