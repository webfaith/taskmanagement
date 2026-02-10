"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { Task } from "@/types/task";
import CalendarView from "@/components/CalendarView";
import CreateTaskModal from "@/components/CreateTaskModal";
import NotificationsPanel from "@/components/NotificationsPanel";
import Link from "next/link";

export default function CalendarPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getTasks();
            setTasks(data);
        } catch (err: any) {
            console.error("Failed to fetch tasks:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (date: Date) => {
        // Could open a modal to add a task for the selected date
        console.log("Selected date:", date);
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
    };

    const handleTaskUpdate = () => {
        fetchTasks();
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
                                📅 Calendar
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                View and manage your tasks on a calendar
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <NotificationsPanel />
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <span>+</span> New Task
                            </button>
                        </div>
                    </div>
                </header>

                {/* Calendar View */}
                <CalendarView
                    tasks={tasks}
                    onDateClick={handleDateClick}
                    onTaskClick={handleTaskClick}
                />

                {/* Legend */}
                <div className="mt-6 flex flex-wrap items-center gap-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Categories:</h4>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-blue-500 rounded"></span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Academic</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-green-500 rounded"></span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Personal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-purple-500 rounded"></span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Work</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-gray-400 rounded opacity-50 line-through"></span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
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
                        href="/dashboard/schedule"
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                        <span className="text-2xl">⚡</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-2">Schedule</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Optimize your day</p>
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

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTaskCreated={handleTaskUpdate}
            />
        </div>
    );
}
