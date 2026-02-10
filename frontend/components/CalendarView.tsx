"use client";

import { useState, useMemo } from "react";
import { Task } from "@/types/task";

interface CalendarViewProps {
    tasks: Task[];
    onDateClick?: (date: Date) => void;
    onTaskClick?: (task: Task) => void;
}

export default function CalendarView({
    tasks,
    onDateClick,
    onTaskClick,
}: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add padding for days from previous month
        const startPadding = firstDay.getDay();
        const prevMonth = new Date(year, month, 0);
        for (let i = startPadding - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonth.getDate() - i);
            days.push({ date, isCurrentMonth: false });
        }

        // Add days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i);
            days.push({ date, isCurrentMonth: true });
        }

        // Add padding for days from next month
        const endPadding = 42 - days.length;
        for (let i = 1; i <= endPadding; i++) {
            const date = new Date(year, month + 1, i);
            days.push({ date, isCurrentMonth: false });
        }

        return days;
    }, [year, month]);

    const getTasksForDate = (date: Date) => {
        return tasks.filter((task) => {
            const taskDate = new Date(task.deadline);
            return (
                taskDate.getFullYear() === date.getFullYear() &&
                taskDate.getMonth() === date.getMonth() &&
                taskDate.getDate() === date.getDate()
            );
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    };

    const isSelected = (date: Date) => {
        return selectedDate && isToday(date)
            ? true
            : selectedDate?.getTime() === date.getTime();
    };

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            if (direction === "prev") {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        if (onDateClick) onDateClick(date);
    };

    const CATEGORY_COLORS: Record<string, string> = {
        academic: "bg-blue-500",
        personal: "bg-green-500",
        work: "bg-purple-500",
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    ←
                </button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {monthNames[month]} {year}
                </h2>
                <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    →
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                        key={day}
                        className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {daysInMonth.map(({ date, isCurrentMonth }, index) => {
                    const dayTasks = getTasksForDate(date);
                    const hasOverdue = dayTasks.some(
                        (t) => new Date(t.deadline) < new Date() && t.status !== "completed"
                    );

                    return (
                        <div
                            key={index}
                            className={`min-h-[100px] p-2 border-b border-r border-gray-100 dark:border-gray-700 cursor-pointer transition ${!isCurrentMonth
                                    ? "bg-gray-50 dark:bg-gray-900/50 text-gray-400"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                } ${isToday(date) ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                            onClick={() => handleDateClick(date)}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span
                                    className={`text-sm font-medium ${isToday(date)
                                            ? "w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center"
                                            : isCurrentMonth
                                                ? "text-gray-900 dark:text-white"
                                                : "text-gray-400"
                                        }`}
                                >
                                    {date.getDate()}
                                </span>
                                {hasOverdue && (
                                    <span className="w-2 h-2 bg-red-500 rounded-full" title="Overdue tasks" />
                                )}
                            </div>

                            {/* Task Indicators */}
                            <div className="space-y-1">
                                {dayTasks.slice(0, 3).map((task) => (
                                    <div
                                        key={task.id}
                                        className={`text-xs px-1.5 py-0.5 rounded truncate text-white cursor-pointer ${CATEGORY_COLORS[task.category] || "bg-gray-500"
                                            } ${task.status === "completed" ? "opacity-50 line-through" : ""}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onTaskClick) onTaskClick(task);
                                        }}
                                        title={task.title}
                                    >
                                        {task.title}
                                    </div>
                                ))}
                                {dayTasks.length > 3 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        +{dayTasks.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selected Date Info */}
            {selectedDate && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {selectedDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </h3>
                    <div className="space-y-2">
                        {getTasksForDate(selectedDate).length > 0 ? (
                            getTasksForDate(selectedDate).map((task) => (
                                <div
                                    key={task.id}
                                    className={`p-2 rounded-lg ${task.status === "completed"
                                            ? "bg-green-100 dark:bg-green-900/30"
                                            : CATEGORY_COLORS[task.category]
                                                ? CATEGORY_COLORS[task.category] + "/20"
                                                : "bg-gray-100 dark:bg-gray-700"
                                        } border-l-4 ${CATEGORY_COLORS[task.category] || "border-gray-500"
                                        }`}
                                    onClick={() => onTaskClick && onTaskClick(task)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-sm font-medium ${task.status === "completed"
                                                    ? "line-through text-gray-500"
                                                    : "text-gray-900 dark:text-white"
                                                }`}
                                        >
                                            {task.title}
                                        </span>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${task.status === "completed"
                                                    ? "bg-green-200 text-green-700"
                                                    : "bg-white dark:bg-gray-600"
                                                }`}
                                        >
                                            {task.status === "completed" ? "✓" : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <span>
                                            ⏰{" "}
                                            {new Date(task.deadline).toLocaleTimeString("en-US", {
                                                hour: "numeric",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        <span>•</span>
                                        <span>{task.estimated_hours}h</span>
                                        <span>•</span>
                                        <span className="capitalize">{task.priority} priority</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No tasks scheduled for this day
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
