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

    const handleTaskUpdate = () => fetchData();
    const handleTaskDelete = () => fetchData();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const calculateWeeklyCompletion = () => {
        if (weeklyData.length === 0) return 0;
        const totalCreated = weeklyData.reduce((sum, day) => sum + day.created, 0);
        const totalCompleted = weeklyData.reduce((sum, day) => sum + day.completed, 0);
        return totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;
    };

    const weeklyCompletion = calculateWeeklyCompletion();
    const productivityScore = stats?.completion_rate || weeklyCompletion || 0;

    const todayDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const getDayName = (dateStr: string) => {
        const date = new Date(dateStr);
        return daysOfWeek[date.getDay()] || "";
    };

    const totalTasks = stats?.total_tasks || tasks.length;
    const completedTasks = stats?.completed_tasks || 0;
    const inProgressTasks = totalTasks - completedTasks;
    const dueTodayTasks = stats?.tasks_today || 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Header */}
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                            {getGreeting()}, {user?.name?.split(" ")[0] || "there"} 👋
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{todayDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationsPanel />
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-1.5"
                        >
                            <span className="text-base leading-none">+</span> New Task
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* Top Row: Stats + Productivity + Weekly */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">

                            {/* Stat Cards */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Tasks</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalTasks}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completed</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedTasks}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">In Progress</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{inProgressTasks}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Due Today</p>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{dueTodayTasks}</p>
                            </div>

                            {/* Productivity Score - compact inline card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 col-span-2">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
                                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{productivityScore}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                        style={{ width: `${productivityScore}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                    {completedTasks} of {totalTasks} tasks done
                                </p>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                                {error}
                            </div>
                        )}

                        {/* Main Content: Urgent Tasks + All Tasks + Weekly */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Left: Urgent Tasks + Weekly Chart */}
                            <div className="space-y-4">
                                {/* Urgent Tasks */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Urgent Tasks</h3>
                                        <span className="text-xs text-gray-400">{tasks.filter(t => t.status !== 'completed').length} pending</span>
                                    </div>
                                    <div className="p-3 space-y-1.5">
                                        {tasks
                                            .filter(t => t.status !== 'completed')
                                            .sort((a, b) => a.priority - b.priority)
                                            .slice(0, 5)
                                            .map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.priority === 1 ? 'bg-red-400' :
                                                        task.priority === 2 ? 'bg-amber-400' :
                                                            task.priority === 3 ? 'bg-yellow-400' : 'bg-gray-300'
                                                        }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                                                {task.title}
                                                            </p>
                                                            <span className="text-[10px] font-bold text-indigo-500/80 uppercase">P{task.priority}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                                            {new Date(task.deadline).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 ${task.category === 'academic' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        task.category === 'personal' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                                            'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                                        }`}>
                                                        {task.category}
                                                    </span>
                                                </div>
                                            ))}
                                        {tasks.filter(t => t.status !== 'completed').length === 0 && (
                                            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
                                                All caught up! 🎉
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Weekly Chart */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">This Week</h3>
                                        <span className="text-xs text-gray-400">{weeklyCompletion}% rate</span>
                                    </div>
                                    <div className="flex items-end justify-between h-16 gap-1">
                                        {weeklyData.length > 0 ? weeklyData.slice(-7).map((day, index) => {
                                            const maxCompleted = Math.max(...weeklyData.map(d => d.completed), 1);
                                            const height = (day.completed / maxCompleted) * 100;
                                            return (
                                                <div key={index} className="flex flex-col items-center gap-0.5 flex-1">
                                                    <div
                                                        className="w-full max-w-[20px] bg-indigo-200 dark:bg-indigo-800 hover:bg-indigo-400 dark:hover:bg-indigo-600 rounded-sm transition"
                                                        style={{ height: `${Math.max(height, 8)}%` }}
                                                    />
                                                    <span className="text-[10px] text-gray-400">{getDayName(day.date)}</span>
                                                </div>
                                            );
                                        }) : daysOfWeek.map((day, index) => (
                                            <div key={index} className="flex flex-col items-center gap-0.5 flex-1">
                                                <div className="w-full max-w-[20px] bg-gray-100 dark:bg-gray-700 rounded-sm" style={{ height: '8%' }} />
                                                <span className="text-[10px] text-gray-400">{day}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                                        <div>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                                {weeklyData.reduce((sum, d) => sum + d.completed, 0)}
                                            </p>
                                            <p className="text-xs text-gray-400">Completed</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                                {weeklyData.reduce((sum, d) => sum + d.created, 0)}
                                            </p>
                                            <p className="text-xs text-gray-400">Created</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Links */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Quick Access</h3>
                                    </div>
                                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                        {[
                                            { href: "/dashboard/calendar", icon: "📅", label: "Calendar", desc: "View tasks on calendar" },
                                            { href: "/dashboard/schedule", icon: "⚡", label: "Schedule", desc: "Optimize your day" },
                                            { href: "/dashboard/analytics", icon: "📊", label: "Analytics", desc: "Productivity insights" },
                                        ].map(link => (
                                            <a
                                                key={link.href}
                                                href={link.href}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                                            >
                                                <span className="text-lg">{link.icon}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{link.label}</p>
                                                    <p className="text-xs text-gray-400">{link.desc}</p>
                                                </div>
                                                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: All Tasks (takes up 2/3) */}
                            <div className="lg:col-span-2">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">All Tasks</h3>
                                        <span className="text-xs text-gray-400">{tasks.length} total</span>
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
                    </div>
                )}

                <CreateTaskModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onTaskCreated={handleTaskUpdate}
                />
            </div>
        </div>
    );
}
