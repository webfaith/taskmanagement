"use client";

import { useMemo } from "react";

interface ProductivityChartProps {
    weeklyData: { date: string; completed: number; created: number }[];
    title?: string;
}

export default function ProductivityChart({ weeklyData, title = "Weekly Productivity" }: ProductivityChartProps) {
    const maxValue = useMemo(() => {
        const max = Math.max(...weeklyData.map((d) => Math.max(d.completed, d.created)));
        return max || 1;
    }, [weeklyData]);

    const chartData = useMemo(() => {
        return weeklyData.map((day, index) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            return {
                ...day,
                dayName,
                completedHeight: (day.completed / maxValue) * 100,
                createdHeight: (day.created / maxValue) * 100,
            };
        });
    }, [weeklyData, maxValue]);

    const totalCompleted = weeklyData.reduce((sum, d) => sum + d.completed, 0);
    const totalCreated = weeklyData.reduce((sum, d) => sum + d.created, 0);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span className="text-gray-600 dark:text-gray-400">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span className="text-gray-600 dark:text-gray-400">Created</span>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{totalCompleted}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">Created</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalCreated}</p>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between h-48 gap-2">
                {chartData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col items-center justify-end h-36 gap-0.5">
                            {/* Created bar */}
                            <div
                                className="w-full max-w-[30px] bg-blue-400 rounded-t transition-all duration-300"
                                style={{ height: `${day.createdHeight}%` }}
                                title={`Created: ${day.created}`}
                            />
                            {/* Completed bar */}
                            <div
                                className="w-full max-w-[30px] bg-green-500 rounded-b transition-all duration-300"
                                style={{ height: `${day.completedHeight}%` }}
                                title={`Completed: ${day.completed}`}
                            />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{day.dayName}</span>
                    </div>
                ))}
            </div>

            {/* Productivity Rate */}
            {totalCreated > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {Math.round((totalCompleted / totalCreated) * 100)}%
                        </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${(totalCompleted / totalCreated) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
