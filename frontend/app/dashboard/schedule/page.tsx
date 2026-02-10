"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { UserSchedule, Task, ScheduleRecommendation } from "@/types/task";
import NotificationsPanel from "@/components/NotificationsPanel";
import Link from "next/link";

export default function SchedulePage() {
    const { user } = useAuth();
    const [schedule, setSchedule] = useState<UserSchedule | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [recommendations, setRecommendations] = useState<ScheduleRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [optimizing, setOptimizing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [showAddCommitment, setShowAddCommitment] = useState(false);
    const [newCommitment, setNewCommitment] = useState({ title: "", start: "", end: "" });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, selectedDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [scheduleData, tasksData] = await Promise.all([
                apiClient.getSchedule(selectedDate),
                apiClient.getTasks(),
            ]);
            setSchedule(scheduleData);
            setTasks(tasksData.filter((t) => t.status !== "completed"));
        } catch (err: any) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOptimize = async () => {
        try {
            setOptimizing(true);
            const recs = await apiClient.optimizeSchedule(selectedDate);
            setRecommendations(recs);
        } catch (err: any) {
            console.error("Failed to optimize schedule:", err);
        } finally {
            setOptimizing(false);
        }
    };

    const handleAddCommitment = async () => {
        try {
            await apiClient.addCommitment(selectedDate, newCommitment);
            setNewCommitment({ title: "", start: "", end: "" });
            setShowAddCommitment(false);
            fetchData();
        } catch (err: any) {
            console.error("Failed to add commitment:", err);
        }
    };

    const handleRemoveCommitment = async (title: string) => {
        try {
            await apiClient.removeCommitment(selectedDate, title);
            fetchData();
        } catch (err: any) {
            console.error("Failed to remove commitment:", err);
        }
    };

    const getHoursScheduled = () => {
        if (!schedule) return 0;
        let total = 0;
        schedule.commitments.forEach((c) => {
            const start = new Date(c.start);
            const end = new Date(c.end);
            total += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        });
        return total;
    };

    const hoursScheduled = getHoursScheduled();
    const workingHours = schedule?.working_hours
        ? (() => {
            const start = new Date(`2000-01-01T${schedule.working_hours.start}`);
            const end = new Date(`2000-01-01T${schedule.working_hours.end}`);
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        })()
        : 8;
    const hoursFree = Math.max(0, workingHours - hoursScheduled);

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
                                ⚡ Schedule Manager
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Optimize your daily schedule
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <NotificationsPanel />
                        </div>
                    </div>
                </header>

                {/* Time Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Working Hours</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                            {workingHours}h
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">per day</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled</h3>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                            {hoursScheduled.toFixed(1)}h
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">commitments</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Free Time</h3>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                            {hoursFree.toFixed(1)}h
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">available</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks</h3>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                            {tasks.length}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">pending</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Commitments */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    📅 Commitments
                                </h3>
                                <button
                                    onClick={() => setShowAddCommitment(true)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    + Add
                                </button>
                            </div>
                            <div className="p-4">
                                {schedule?.commitments && schedule.commitments.length > 0 ? (
                                    <div className="space-y-3">
                                        {schedule.commitments.map((commitment, index) => (
                                            <div
                                                key={index}
                                                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between group"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {commitment.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(commitment.start).toLocaleTimeString([], {
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                        })}{" "}
                                                        -{" "}
                                                        {new Date(commitment.end).toLocaleTimeString([], {
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveCommitment(commitment.title)}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        No commitments scheduled
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Free Slots */}
                        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    🕐 Free Slots
                                </h3>
                            </div>
                            <div className="p-4">
                                {schedule?.free_slots && schedule.free_slots.length > 0 ? (
                                    <div className="space-y-3">
                                        {schedule.free_slots.map((slot, index) => (
                                            <div
                                                key={index}
                                                className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                                            >
                                                <p className="font-medium text-green-700 dark:text-green-400">
                                                    {new Date(slot.start).toLocaleTimeString([], {
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })}{" "}
                                                    -{" "}
                                                    {new Date(slot.end).toLocaleTimeString([], {
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        No free slots defined
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Optimize */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        🚀 AI Schedule Optimization
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Let AI suggest the best time to work on your tasks
                                    </p>
                                </div>
                                <button
                                    onClick={handleOptimize}
                                    disabled={optimizing}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {optimizing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Optimizing...
                                        </>
                                    ) : (
                                        <>
                                            ⚡ Optimize
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="p-6">
                                {recommendations.length > 0 ? (
                                    <div className="space-y-4">
                                        {recommendations.map((rec, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-lg border ${rec.energy_match
                                                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                                        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                                            {rec.task.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {rec.reason}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {new Date(rec.suggested_time).toLocaleTimeString([], {
                                                                hour: "numeric",
                                                                minute: "2-digit",
                                                            })}
                                                        </span>
                                                        {rec.energy_match && (
                                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                                                                ⚡ Energy Match
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <span className="text-4xl">🤖</span>
                                        <p className="text-gray-500 dark:text-gray-400 mt-4">
                                            Click "Optimize" to get AI-powered scheduling recommendations
                                        </p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                            Based on your energy levels and task priorities
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Tasks */}
                        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    📋 Pending Tasks
                                </h3>
                            </div>
                            <div className="p-4">
                                {tasks.length > 0 ? (
                                    <div className="space-y-2">
                                        {tasks.slice(0, 5).map((task) => (
                                            <div
                                                key={task.id}
                                                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {task.estimated_hours}h • {task.energy_level} energy
                                                    </p>
                                                </div>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${task.priority <= 2
                                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                            : task.priority <= 3
                                                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        }`}
                                                >
                                                    P{task.priority}
                                                </span>
                                            </div>
                                        ))}
                                        {tasks.length > 5 && (
                                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                                                +{tasks.length - 5} more tasks
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        No pending tasks
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Navigation */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        href="/dashboard/analytics"
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                        <span className="text-2xl">📊</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-2">Analytics</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View insights</p>
                    </Link>
                </div>
            </div>

            {/* Add Commitment Modal */}
            {showAddCommitment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Add Commitment
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newCommitment.title}
                                    onChange={(e) =>
                                        setNewCommitment({ ...newCommitment, title: e.target.value })
                                    }
                                    placeholder="e.g., Meeting, Class"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCommitment.start}
                                        onChange={(e) =>
                                            setNewCommitment({ ...newCommitment, start: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCommitment.end}
                                        onChange={(e) =>
                                            setNewCommitment({ ...newCommitment, end: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddCommitment(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCommitment}
                                disabled={!newCommitment.title || !newCommitment.start || !newCommitment.end}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                Add Commitment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
