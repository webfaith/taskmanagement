"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { ProductivityStats, TaskCategory, TaskPriority } from "@/types/task";
import ProductivityChart from "@/components/ProductivityChart";
import NotificationsPanel from "@/components/NotificationsPanel";
import Link from "next/link";
import { getBalanceScore, getEffectivenessReport, getAIInsights } from "@/lib/evaluation";
import { BalanceScore, EffectivenessReport } from "@/types/evaluation";

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<ProductivityStats | null>(null);
    const [balance, setBalance] = useState<BalanceScore | null>(null);
    const [report, setReport] = useState<EffectivenessReport | null>(null);
    const [insights, setInsights] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

    useEffect(() => {
        if (user) {
            fetchStats();
            fetchEvaluationData();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getProductivityStats();
            setStats(data);
        } catch (err: any) {
            console.error("Failed to fetch stats:", err);
            // Generate mock stats for demo
            setStats({
                total_tasks: 45,
                completed_tasks: 32,
                completion_rate: 71,
                tasks_today: 5,
                hours_scheduled: 24,
                hours_free: 8,
                streak_days: 7,
                weekly_data: [
                    { date: "2024-01-22", completed: 4, created: 5 },
                    { date: "2024-01-23", completed: 3, created: 4 },
                    { date: "2024-01-24", completed: 5, created: 6 },
                    { date: "2024-01-25", completed: 2, created: 3 },
                    { date: "2024-01-26", completed: 6, created: 7 },
                    { date: "2024-01-27", completed: 4, created: 4 },
                    { date: "2024-01-28", completed: 8, created: 8 },
                ],
                category_breakdown: [
                    { category: "academic" as TaskCategory, count: 20, completed: 15 },
                    { category: "personal" as TaskCategory, count: 15, completed: 12 },
                    { category: "work" as TaskCategory, count: 10, completed: 5 },
                ],
                priority_distribution: [
                    { priority: 1 as TaskPriority, count: 5 },
                    { priority: 2 as TaskPriority, count: 8 },
                    { priority: 3 as TaskPriority, count: 15 },
                    { priority: 4 as TaskPriority, count: 12 },
                    { priority: 5 as TaskPriority, count: 5 },
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchEvaluationData = async () => {
        try {
            const [balanceData, reportData, insightsData] = await Promise.all([
                getBalanceScore(),
                getEffectivenessReport('weekly'),
                getAIInsights(),
            ]);
            setBalance(balanceData);
            setReport(reportData);
            setInsights(insightsData);
        } catch (err) {
            console.error("Failed to fetch evaluation data:", err);
            // Mock data
            setBalance({
                academic: 45,
                personal: 30,
                work: 25,
                overall: 75
            });
            setReport({
                period: 'weekly',
                start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                end_date: new Date().toISOString(),
                total_tasks: 25,
                completed_tasks: 18,
                completion_rate: 0.72,
                average_time_estimate_vs_actual: 1.2,
                productivity_score: 78,
                stress_reduction_score: 65,
                balance_improvement_score: 72,
                recommendations: [
                    "Try breaking large tasks into smaller sub-tasks",
                    "Consider adjusting your schedule for peak energy hours"
                ]
            });
            setInsights([
                "You're most productive on Tuesdays",
                "Your time estimates are 15% optimistic",
                "Consider more personal time on weekends"
            ]);
        }
    };

    const CATEGORY_COLORS: Record<string, string> = {
        academic: "bg-blue-500",
        personal: "bg-green-500",
        work: "bg-purple-500",
    };

    const PRIORITY_COLORS: Record<number, string> = {
        1: "bg-red-500",
        2: "bg-orange-500",
        3: "bg-yellow-500",
        4: "bg-green-500",
        5: "bg-gray-500",
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 bg-green-100";
        if (score >= 60) return "text-yellow-600 bg-yellow-100";
        return "text-red-600 bg-red-100";
    };

    const downloadCSV = () => {
        if (!stats) return;

        const headers = ["Category", "Total Tasks", "Completed Tasks", "Completion Rate"];
        const rows = stats.category_breakdown.map((c) => [
            c.category,
            c.count,
            c.completed,
            `${Math.round((c.completed / c.count) * 100)}%`,
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `productivity-report-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-2 inline-block">
                                ← Back to Dashboard
                            </Link>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                📊 Analytics
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Track your productivity and insights
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value as any)}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="year">Last Year</option>
                            </select>
                            <NotificationsPanel />
                            <button
                                onClick={downloadCSV}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                            >
                                📥 Export CSV
                            </button>
                        </div>
                    </div>
                </header>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                    {stats?.total_tasks || 0}
                                </p>
                            </div>
                            <span className="text-3xl">📋</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</h3>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                                    {stats?.completed_tasks || 0}
                                </p>
                            </div>
                            <span className="text-3xl">✅</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                    {stats?.completion_rate || 0}%
                                </p>
                            </div>
                            <span className="text-3xl">📈</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Streak</h3>
                                <p className="text-3xl font-bold text-orange-500 mt-2">
                                    🔥 {stats?.streak_days || 0}
                                </p>
                            </div>
                            <span className="text-3xl">🔥</span>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Weekly Productivity Chart */}
                    <div className="lg:col-span-2">
                        <ProductivityChart
                            weeklyData={stats?.weekly_data || []}
                            title="Weekly Productivity"
                        />
                    </div>
                </div>

                {/* Usability Metrics Section */}
                {report && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            📊 Effectiveness & Usability Metrics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${getScoreColor(report.productivity_score)}`}>
                                    <span className="text-2xl font-bold">{report.productivity_score}</span>
                                </div>
                                <p className="text-sm text-center text-gray-500 dark:text-gray-400">Productivity Score</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${getScoreColor(report.stress_reduction_score)}`}>
                                    <span className="text-2xl font-bold">{report.stress_reduction_score}</span>
                                </div>
                                <p className="text-sm text-center text-gray-500 dark:text-gray-400">Stress Reduction</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${getScoreColor(report.balance_improvement_score)}`}>
                                    <span className="text-2xl font-bold">{report.balance_improvement_score}</span>
                                </div>
                                <p className="text-sm text-center text-gray-500 dark:text-gray-400">Balance Score</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${getScoreColor(report.completion_rate * 100)}`}>
                                    <span className="text-2xl font-bold">{(report.completion_rate * 100).toFixed(0)}</span>
                                </div>
                                <p className="text-sm text-center text-gray-500 dark:text-gray-400">Completion Rate</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Balance Analysis */}
                {balance && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            ⚖️ Balance Analysis
                        </h3>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Academic</span>
                                        <span className="font-medium">{balance.academic}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${balance.academic}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Personal</span>
                                        <span className="font-medium">{balance.personal}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 transition-all" style={{ width: `${balance.personal}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Work</span>
                                        <span className="font-medium">{balance.work}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 transition-all" style={{ width: `${balance.work}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Overall Balance</span>
                                        <span className={`font-medium ${balance.overall >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>{balance.overall}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className={`h-full ${balance.overall >= 70 ? 'bg-green-500' : 'bg-yellow-500'} transition-all`} style={{ width: `${balance.overall}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Insights */}
                {insights.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            ✨ AI Insights
                        </h3>
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6">
                            <ul className="space-y-3">
                                {insights.map((insight, index) => (
                                    <li key={index} className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                                        <span className="text-purple-500 mt-1">💡</span>
                                        <span className="text-gray-700 dark:text-gray-300">{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Category and Priority Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Category Breakdown */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            📚 Category Breakdown
                        </h3>
                        {stats?.category_breakdown && stats.category_breakdown.length > 0 ? (
                            <div className="space-y-4">
                                {stats.category_breakdown.map((cat) => (
                                    <div key={cat.category}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat.category] || "bg-gray-500"
                                                        }`}
                                                ></span>
                                                <span className="font-medium text-gray-900 dark:text-white capitalize">
                                                    {cat.category}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {cat.completed}/{cat.count} ({Math.round((cat.completed / cat.count) * 100)}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${CATEGORY_COLORS[cat.category] || "bg-gray-500"} transition-all duration-500`}
                                                style={{ width: `${(cat.completed / cat.count) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                No category data available
                            </p>
                        )}
                    </div>

                    {/* Priority Distribution */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            🎯 Priority Distribution
                        </h3>
                        {stats?.priority_distribution && stats.priority_distribution.length > 0 ? (
                            <div className="space-y-3">
                                {stats.priority_distribution.map((p) => (
                                    <div key={p.priority} className="flex items-center gap-4">
                                        <span className="w-20 text-sm text-gray-600 dark:text-gray-400">
                                            P{p.priority}
                                        </span>
                                        <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${PRIORITY_COLORS[p.priority] || "bg-gray-500"} transition-all duration-500`}
                                                style={{
                                                    width: `${(p.count / Math.max(...stats.priority_distribution.map((d) => d.count))) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-8 text-sm text-gray-900 dark:text-white text-right">
                                            {p.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                No priority data available
                            </p>
                        )}
                    </div>
                </div>

                {/* Streak and Achievements */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
                        <h3 className="text-lg font-semibold">🔥 Current Streak</h3>
                        <p className="text-5xl font-bold mt-4">{stats?.streak_days || 0} days</p>
                        <p className="text-sm opacity-80 mt-2">Keep it up!</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-6 text-white">
                        <h3 className="text-lg font-semibold">📈 Tasks This Week</h3>
                        <p className="text-5xl font-bold mt-4">
                            {stats?.weekly_data?.reduce((sum, d) => sum + d.completed, 0) || 0}
                        </p>
                        <p className="text-sm opacity-80 mt-2">Completed tasks</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-6 text-white">
                        <h3 className="text-lg font-semibold">✅ Completion Rate</h3>
                        <p className="text-5xl font-bold mt-4">{stats?.completion_rate || 0}%</p>
                        <p className="text-sm opacity-80 mt-2">Overall performance</p>
                    </div>
                </div>

                {/* Quick Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Link
                        href="/dashboard"
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                        <span className="text-2xl">📋</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-2">Task List</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View all tasks</p>
                    </Link>
                    <Link
                        href="/dashboard/calendar"
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                        <span className="text-2xl">📅</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-2">Calendar</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View calendar</p>
                    </Link>
                    <Link
                        href="/dashboard/schedule"
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                        <span className="text-2xl">⚡</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-2">Schedule</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Optimize your day</p>
                    </Link>
                    <Link
                        href="/dashboard/evaluation"
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                        <span className="text-2xl">🎯</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-2">Evaluation</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View effectiveness</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
