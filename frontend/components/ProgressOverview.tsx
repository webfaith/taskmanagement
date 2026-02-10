"use client";

import { useMemo } from "react";
import { Task, ProductivityStats } from "@/types/task";

interface ProgressOverviewProps {
    tasks: Task[];
    stats?: ProductivityStats;
}

export default function ProgressOverview({ tasks, stats }: ProgressOverviewProps) {
    const computed = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === "completed").length;
        const inProgress = tasks.filter((t) => t.status === "in_progress").length;
        const todo = tasks.filter((t) => t.status === "todo").length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tasksDueToday = tasks.filter((t) => {
            const deadline = new Date(t.deadline);
            return deadline >= today && deadline < tomorrow && t.status !== "completed";
        });

        const overdue = tasks.filter(
            (t) => new Date(t.deadline) < today && t.status !== "completed"
        );

        const academicTasks = tasks.filter((t) => t.category === "academic").length;
        const personalTasks = tasks.filter((t) => t.category === "personal").length;
        const workTasks = tasks.filter((t) => t.category === "work").length;

        return {
            total,
            completed,
            inProgress,
            todo,
            percentage,
            tasksDueToday: tasksDueToday.length,
            overdue: overdue.length,
            academicTasks,
            personalTasks,
            workTasks,
        };
    }, [tasks]);

    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return "bg-green-500";
        if (percentage >= 60) return "bg-blue-500";
        if (percentage >= 40) return "bg-yellow-500";
        if (percentage >= 20) return "bg-orange-500";
        return "bg-red-500";
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Overall Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Overall Progress
                    </h3>
                    <span className="text-2xl">📊</span>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {computed.percentage}%
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        ({computed.completed}/{computed.total})
                    </span>
                </div>
                <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getProgressColor(computed.percentage)} transition-all duration-500`}
                        style={{ width: `${computed.percentage}%` }}
                    />
                </div>
            </div>

            {/* Tasks Due Today */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Due Today
                    </h3>
                    <span className="text-2xl">📅</span>
                </div>
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {computed.tasksDueToday}
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    tasks to complete
                </p>
                {computed.overdue > 0 && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                        ⚠️ {computed.overdue} overdue
                    </span>
                )}
            </div>

            {/* In Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        In Progress
                    </h3>
                    <span className="text-2xl">🔄</span>
                </div>
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {computed.inProgress}
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    actively working
                </p>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Categories
                    </h3>
                    <span className="text-2xl">📚</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600 dark:text-blue-400">📚 Academic</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {computed.academicTasks}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400">🏠 Personal</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {computed.personalTasks}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-600 dark:text-purple-400">💼 Work</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {computed.workTasks}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats from API */}
            {stats && (
                <>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Streak
                            </h3>
                            <span className="text-2xl">🔥</span>
                        </div>
                        <span className="text-3xl font-bold text-orange-500">
                            {stats.streak_days}
                        </span>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            consecutive days
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Completion Rate
                            </h3>
                            <span className="text-2xl">✅</span>
                        </div>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {stats.completion_rate}%
                        </span>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            tasks completed
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
