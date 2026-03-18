"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { Task } from "@/types/task";
import CreateTaskModal from "@/components/CreateTaskModal";
import TaskList from "@/components/TaskList";
import Link from "next/link";

export default function TasksPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const tasksData = await apiClient.getTasks();
            setTasks(tasksData);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskUpdate = () => fetchData();

    return (
        <div className="max-w-7xl mx-auto py-6">
            {/* Breadcrumbs */}
            <nav className="flex mb-4 text-sm text-gray-500 dark:text-gray-400">
                <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900 dark:text-white font-medium">Tasks</span>
            </nav>

            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Tasks</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage, filter, and track all your tasks in one place</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-md flex items-center justify-center gap-2"
                >
                    <span className="text-xl leading-none">+</span> New Task
                </button>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                        <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading your tasks...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-1 sm:p-6">
                        <TaskList
                            tasks={tasks}
                            onUpdate={handleTaskUpdate}
                            onDelete={handleTaskUpdate}
                            showFilters={true}
                        />
                    </div>
                </div>
            )}

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTaskCreated={handleTaskUpdate}
            />
        </div>
    );
}
