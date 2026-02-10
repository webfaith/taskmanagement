// Weekly Survey Page
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitSurvey, getEffectivenessReport } from '@/lib/evaluation';
import { WEEKLY_SURVEY_QUESTIONS, EffectivenessReport } from '@/types/evaluation';

export default function WeeklySurveyPage() {
    const router = useRouter();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number | string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [report, setReport] = useState<EffectivenessReport | null>(null);

    const question = WEEKLY_SURVEY_QUESTIONS[currentQuestion];
    const progress = ((currentQuestion + 1) / WEEKLY_SURVEY_QUESTIONS.length) * 100;

    const handleAnswer = (value: number | string) => {
        setAnswers({ ...answers, [question.id]: value });
    };

    const handleNext = () => {
        if (currentQuestion < WEEKLY_SURVEY_QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!answers[question.id] && question.required) return;

        setIsSubmitting(true);
        try {
            await submitSurvey(answers);

            // Get effectiveness report after survey
            const effectivenessReport = await getEffectivenessReport('weekly');
            setReport(effectivenessReport);
            setSubmitted(true);
        } catch (error) {
            console.error('Failed to submit survey:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted && report) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 mb-6">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Weekly Survey Complete!</h2>
                        <p className="text-gray-600">Here's your effectiveness report for this week</p>
                    </div>
                </div>

                {/* Report Summary */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Week at a Glance</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4">
                            <p className="text-sm text-gray-500">Completion Rate</p>
                            <p className="text-2xl font-bold text-blue-600">{(report.completion_rate * 100).toFixed(0)}%</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                            <p className="text-sm text-gray-500">Productivity Score</p>
                            <p className="text-2xl font-bold text-green-600">{report.productivity_score}</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                            <p className="text-sm text-gray-500">Stress Reduction</p>
                            <p className="text-2xl font-bold text-purple-600">{report.stress_reduction_score}</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4">
                            <p className="text-sm text-gray-500">Balance Score</p>
                            <p className="text-2xl font-bold text-orange-600">{report.balance_improvement_score}</p>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                {report.recommendations.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">💡 AI Recommendations</h3>
                        <ul className="space-y-3">
                            {report.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span className="text-gray-600">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Question {currentQuestion + 1} of {WEEKLY_SURVEY_QUESTIONS.length}</span>
                    <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">{question.question}</h2>

                {question.type === 'rating' ? (
                    <div className="space-y-6">
                        <div className="flex justify-center gap-3">
                            {[...Array(question.max! - question.min! + 1)].map((_, i) => {
                                const value = (question.min || 1) + i;
                                const isSelected = answers[question.id] === value;
                                return (
                                    <button
                                        key={value}
                                        onClick={() => handleAnswer(value)}
                                        className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${isSelected
                                                ? 'bg-blue-500 text-white scale-110'
                                                : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        {value}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 px-4">
                            <span>{question.min === 1 ? 'Low' : 'Not at all'}</span>
                            <span>{question.max === 10 ? 'High' : 'Very much'}</span>
                        </div>
                    </div>
                ) : (
                    <textarea
                        value={(answers[question.id] as string) || ''}
                        onChange={(e) => handleAnswer(e.target.value)}
                        placeholder="Share your thoughts..."
                        className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                    />
                )}
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
                {currentQuestion > 0 && (
                    <button
                        onClick={() => setCurrentQuestion(currentQuestion - 1)}
                        className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        Previous
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={question.required && !answers[question.id] || isSubmitting}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${question.required && !answers[question.id]
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                >
                    {currentQuestion === WEEKLY_SURVEY_QUESTIONS.length - 1
                        ? (isSubmitting ? 'Submitting...' : 'Submit Survey')
                        : 'Next'}
                </button>
            </div>
        </div>
    );
}
