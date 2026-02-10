"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { Task, ProductivityStats } from "@/types/task";
import CreateTaskModal from "@/components/CreateTaskModal";
import TaskList from "@/components/TaskList";
import NotificationsPanel from "@/components/NotificationsPanel";

interface WeeklyData {
    date: string;
    completed: number;
    created: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stats, setStats] = useState<ProductivityStats | null>(null);
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksData, statsData, weeklyDataResponse] = await Promise.all([
                apiClient.getTasks(),
                apiClient.getProductivityStats().catch(() => null),
                apiClient.getWeeklyProductivity().catch(() => []),
            ]);
            setTasks(tasksData);
            setStats(statsData);
            setWeeklyData(weeklyDataResponse);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load some data. Showing cached tasks if available.");
        } finally {
            setLoading(false);
        }
    };

    const handleTaskUpdate = () => {
        fetchData();
    };

    const handleTaskDelete = () => {
        fetchData();
    };

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    // Calculate weekly completion rate
    const calculateWeeklyCompletion = () => {
        if (weeklyData.length === 0) return 0;
        const totalCreated = weeklyData.reduce((sum, day) => sum + day.created, 0);
        const totalCompleted = weeklyData.reduce((sum, day) => sum + day.completed, 0);
        return totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;
    };

    const weeklyCompletion = calculateWeeklyCompletion();
    const productivityScore = stats?.completion_rate || weeklyCompletion || 85;

    // Get greeting based on time
    const todayDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Calculate days of week for chart
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const getDayName = (dateStr: string) => {
        const date = new Date(dateStr);
        return daysOfWeek[date.getDay()] || "";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {getGreeting()}, {user?.name?.split(" ")[0] || "there"}! 👋
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {todayDate}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <NotificationsPanel />
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <span>+</span> New Task
                            </button>
                        </div>
                    </div>
                </header>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Productivity Section - Redesigned */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Main Productivity Score */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold opacity-90">Productivity Score</h3>
                                    <span className="text-3xl">📊</span>
                                </div>
                                <div className="flex items-end gap-4">
                                    <span className="text-6xl font-bold">{productivityScore}%</span>
                                    <div className="mb-2 text-blue-100">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Great job!</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="mt-6">
                                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white rounded-full transition-all duration-500"
                                            style={{ width: `${productivityScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* This Week Overview */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">This Week</h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Last 7 days</span>
                                </div>
                                {/* Weekly Chart */}
                                <div className="flex items-end justify-between h-24 gap-2">
                                    {weeklyData.length > 0 ? weeklyData.slice(-7).map((day, index) => {
                                        const maxCompleted = Math.max(...weeklyData.map(d => d.completed), 1);
                                        const height = (day.completed / maxCompleted) * 100;
                                        return (
                                            <div key={index} className="flex flex-col items-center gap-1 flex-1">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {day.completed}
                                                </div>
                                                <div
                                                    className="w-full max-w-[24px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-300 hover:from-blue-700 hover:to-blue-500"
                                                    style={{ height: `${Math.max(height, 10)}%` }}
                                                ></div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {getDayName(day.date)}
                                                </span>
                                            </div>
                                        );
                                    }) : (
                                        // Empty state
                                        daysOfWeek.map((day, index) => (
                                            <div key={index} className="flex flex-col items-center gap-1 flex-1">
                                                <div className="text-xs text-gray-400">0</div>
                                                <div className="w-full max-w-[24px] bg-gray-100 dark:bg-gray-700 rounded-t-md" style={{ height: '10%' }}></div>
                                                <span className="text-xs text-gray-400">{day}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {/* Summary Stats */}
                                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {weeklyData.reduce((sum, d) => sum + d.completed, 0)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {weeklyData.reduce((sum, d) => sum + d.created, 0)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Created</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {weeklyCompletion}%
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <span className="text-xl">📋</span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {stats?.total_tasks || tasks.length}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <span className="text-xl">✅</span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {stats?.completed_tasks || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                        <span className="text-xl">⏳</span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {(stats?.total_tasks || tasks.length) - (stats?.completed_tasks || 0)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">In Progress</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                        <span className="text-xl">🔥</span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {stats?.tasks_today || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Due Today</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400">
                                {error}
                            </div>
                        )}

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Urgent Tasks */}
                            <div className="lg:col-span-1">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <span>⚡</span> Urgent Tasks
                                        </h3>
                                    </div>
                                    <div className="p-4">
                                        {tasks
                                            .filter(t => t.status !== 'completed')
                                            .sort((a, b) => a.priority - b.priority)
                                            .slice(0, 5)
                                            .map((task, index) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center gap-3 p-3 mb-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${task.priority === 1 ? 'bg-red-500' :
                                                        task.priority === 2 ? 'bg-orange-500' :
                                                            task.priority === 3 ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                                            {task.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Due: {new Date(task.deadline).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${task.category === 'academic' ? 'bg-blue-100 text-blue-700' :
                                                        task.category === 'personal' ? 'bg-green-100 text-green-700' :
                                                            'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {task.category}
                                                    </span>
                                                </div>
                                            ))}
                                        {tasks.filter(t => t.status !== 'completed').length === 0 && (
                                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                                No urgent tasks! 🎉
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - All Tasks */}
                            <div className="lg:col-span-2">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>📋</span> All Tasks
                                        </h3>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {tasks.length} total
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <TaskList
                                            tasks={tasks}
                                            onUpdate={handleTaskUpdate}
                                            onDelete={handleTaskDelete}
                                            showFilters={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a
                                href="/dashboard/calendar"
                                className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl group-hover:scale-110 transition">📅</span>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            Calendar View
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            View tasks on calendar
                                        </p>
                                    </div>
                                </div>
                            </a>
                            <a
                                href="/dashboard/schedule"
                                className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl group-hover:scale-110 transition">⚡</span>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            Schedule Manager
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Optimize your day
                                        </p>
                                    </div>
                                </div>
                            </a>
                            <a
                                href="/dashboard/analytics"
                                className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl group-hover:scale-110 transition">📊</span>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            Analytics
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            View productivity insights
                                        </p>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                )}

                {/* Create Task Modal */}
                <CreateTaskModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onTaskCreated={handleTaskUpdate}
                />
            </div>
        </div>
    );
}
