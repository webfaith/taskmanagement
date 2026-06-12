"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { Task } from "@/types/task";
import CreateTaskModal from "@/components/CreateTaskModal";
import ImportTasksModal from "@/components/ImportTasksModal";
import TaskList from "@/components/TaskList";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function TasksPage() {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery<Task[]>({
        queryKey: ["tasks"],
        queryFn: () => apiClient.getTasks(),
        enabled: !!user,
        staleTime: 1000 * 60,
    });

    const createTaskMutation = useMutation({
        mutationFn: (taskData: Partial<Task>) => apiClient.createTask(taskData),
        onSuccess: (newTask) => {
            queryClient.setQueryData<Task[]>(["tasks"], (old = []) => [newTask, ...old]);
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
        onError: (err) => {
            console.error(getErrorMessage(err));
        },
    });

    const handleCreateTask = async (taskData: Partial<Task>) => {
        await createTaskMutation.mutateAsync(taskData);
    };

    const handleImportTasks = async (tasksData: Partial<Task>[]) => {
        for (const taskData of tasksData) {
            await handleCreateTask(taskData);
        }
    };

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
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm flex items-center justify-center gap-2"
                    >
                        <span>📝</span> Import Text
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-md flex items-center justify-center gap-2"
                    >
                        <span className="text-xl leading-none">+</span> New Task
                    </button>
                </div>
            </header>

            {isLoading ? (
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
                            onUpdate={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}
                            onDelete={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}
                            showFilters={true}
                        />
                    </div>
                </div>
            )}

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateTask}
                isSubmitting={createTaskMutation.isPending}
            />

            <ImportTasksModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImported={handleImportTasks}
            />
        </div>
    );
}
