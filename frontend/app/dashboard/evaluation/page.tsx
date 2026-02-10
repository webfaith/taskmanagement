// Effectiveness Dashboard Page
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    getEffectivenessReport,
    getProductivityTrend,
    getBalanceScore,
    getStressTrend,
    getCompletionRateTrend,
    getAIInsights,
    getQuickStats,
} from '@/lib/evaluation';
import {
    EffectivenessReport,
    ProductivityTrend,
    BalanceScore,
    DailyCheckIn
} from '@/types/evaluation';

export default function EvaluationDashboardPage() {
    const [report, setReport] = useState<EffectivenessReport | null>(null);
    const [productivityTrend, setProductivityTrend] = useState<ProductivityTrend[]>([]);
    const [balance, setBalance] = useState<BalanceScore | null>(null);
    const [stressTrend, setStressTrend] = useState<ProductivityTrend[]>([]);
    const [completionTrend, setCompletionTrend] = useState<ProductivityTrend[]>([]);
    const [insights, setInsights] = useState<string[]>([]);
    const [stats, setStats] = useState<{
        total_tasks_completed: number;
        average_tasks_per_day: number;
        best_productivity_day: string;
        streak: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [reportData, productivity, balanceData, stress, completion, insightsData, statsData] = await Promise.all([
                getEffectivenessReport('weekly'),
                getProductivityTrend(7),
                getBalanceScore(),
                getStressTrend(7),
                getCompletionRateTrend(7),
                getAIInsights(),
                getQuickStats(),
            ]);
            setReport(reportData);
            setProductivityTrend(productivity);
            setBalance(balanceData);
            setStressTrend(stress);
            setCompletionTrend(completion);
            setInsights(insightsData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load evaluation data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Effectiveness Dashboard</h1>
                    <p className="text-gray-500">Track your productivity and well-being</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/evaluation/survey" className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                        Weekly Survey
                    </Link>
                    <Link href="/dashboard/evaluation/export" className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                        Export Data
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500">Tasks Completed</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.total_tasks_completed}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500">Avg Tasks/Day</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.average_tasks_per_day.toFixed(1)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500">Best Day</p>
                        <p className="text-2xl font-bold text-green-600">{stats.best_productivity_day || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500">Streak</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.streak} days</p>
                    </div>
                </div>
            )}

            {/* Main Metrics */}
            {report && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Productivity Score */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800">Productivity Score</h3>
                            <span className="text-2xl">📈</span>
                        </div>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${getScoreColor(report.productivity_score)}`}>
                            <span className="text-3xl font-bold">{report.productivity_score}</span>
                        </div>
                        <p className="text-sm text-gray-500 text-center">Based on task completion, schedule adherence, and time estimates</p>
                    </div>

                    {/* Balance Meter */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800">Balance Meter</h3>
                            <span className="text-2xl">⚖️</span>
                        </div>
                        {balance && (
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Academic</span>
                                        <span className="font-medium">{balance.academic}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${balance.academic}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Personal</span>
                                        <span className="font-medium">{balance.personal}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${balance.personal}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Work</span>
                                        <span className="font-medium">{balance.work}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500" style={{ width: `${balance.work}%` }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stress Reduction */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800">Stress Reduction</h3>
                            <span className="text-2xl">🧘</span>
                        </div>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${getScoreColor(report.stress_reduction_score)}`}>
                            <span className="text-3xl font-bold">{report.stress_reduction_score}</span>
                        </div>
                        <p className="text-sm text-gray-500 text-center">Based on your feedback and check-ins</p>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Completion Rate Chart */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Weekly Completion Rate</h3>
                    <div className="flex items-end justify-between h-40">
                        {completionTrend.slice(-7).map((item, index) => {
                            const maxValue = Math.max(...completionTrend.map(t => t.score), 100);
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                    <div className="w-full max-w-[40px]">
                                        <div
                                            className="bg-blue-500 rounded-t-lg transition-all duration-300"
                                            style={{ height: `${(item.score / maxValue) * 100}%`, minHeight: '4px' }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Productivity Trend */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Productivity Trend</h3>
                    <div className="flex items-end justify-between h-40">
                        {productivityTrend.slice(-7).map((item, index) => {
                            const maxValue = Math.max(...productivityTrend.map(t => t.score), 100);
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                    <div className="w-full max-w-[40px]">
                                        <div
                                            className="bg-green-500 rounded-t-lg transition-all duration-300"
                                            style={{ height: `${(item.score / maxValue) * 100}%`, minHeight: '4px' }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 mb-8">
                    <h3 className="font-semibold text-gray-800 mb-4">✨ AI Insights</h3>
                    <ul className="space-y-3">
                        {insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm">
                                <span className="text-purple-500 mt-1">💡</span>
                                <span className="text-gray-700">{insight}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommendations */}
            {report && report.recommendations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">📋 Recommendations</h3>
                    <ul className="space-y-3">
                        {report.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <span className="text-blue-500 mt-1">•</span>
                                <span className="text-gray-700">{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/dashboard/evaluation/stories" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                        📖
                    </div>
                    <div>
                        <p className="font-medium text-gray-800">Success Stories</p>
                        <p className="text-sm text-gray-500">Learn from others</p>
                    </div>
                </Link>
                <Link href="/dashboard/analytics" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                        📊
                    </div>
                    <div>
                        <p className="font-medium text-gray-800">Detailed Analytics</p>
                        <p className="text-sm text-gray-500">View full analysis</p>
                    </div>
                </Link>
                <Link href="/dashboard" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                        🏠
                    </div>
                    <div>
                        <p className="font-medium text-gray-800">Back to Dashboard</p>
                        <p className="text-sm text-gray-500">Return home</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
