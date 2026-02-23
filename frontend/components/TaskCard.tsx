"use client";

import { useState } from "react";
import { Task, TaskCategory, TaskPriority, TaskStatus } from "@/types/task";
import apiClient from "@/lib/api";
import EditTaskModal from "./EditTaskModal";

interface TaskCardProps {
    task: Task;
    onUpdate: () => void;
    onDelete: () => void;
    compact?: boolean;
}

const CATEGORY_STYLES: Record<TaskCategory, { bg: string; border: string; text: string; icon: string }> = {
    academic: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-l-blue-500",
        text: "text-blue-700 dark:text-blue-300",
        icon: "📚",
    },
    personal: {
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-l-green-500",
        text: "text-green-700 dark:text-green-300",
        icon: "🏠",
    },
    work: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-l-purple-500",
        text: "text-purple-700 dark:text-purple-300",
        icon: "💼",
    },
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
    1: "bg-red-500 text-white",
    2: "bg-orange-500 text-white",
    3: "bg-yellow-500 text-gray-800",
    4: "bg-green-500 text-white",
    5: "bg-gray-400 text-white",
};

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string }> = {
    todo: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300" },
    in_progress: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
    completed: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
};

const ENERGY_ICONS: Record<string, string> = {
    high: "⚡",
    medium: "🌊",
    low: "🔋",
};

export default function TaskCard({ task, onUpdate, onDelete, compact = false }: TaskCardProps) {
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const categoryStyle = CATEGORY_STYLES[task.category];
    const isOverdue = new Date(task.deadline) < new Date() && task.status !== "completed";
    const deadlineDate = new Date(task.deadline);
    const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

    const getTimeUntilDeadline = () => {
        const now = new Date();
        const diff = deadlineDate.getTime() - now.getTime();
        if (diff <= 0) return "Overdue";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h`;
        return "Less than an hour";
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        try {
            const newStatus: TaskStatus = e.target.checked ? "completed" : "todo";
            await apiClient.updateTaskStatus(task.id, newStatus);
            onUpdate();
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this task?")) return;

        setLoading(true);
        try {
            await apiClient.deleteTask(task.id);
            onDelete();
        } catch (error) {
            console.error("Failed to delete task:", error);
        } finally {
            setLoading(false);
        }
    };

    if (compact) {
        return (
            <div
                className={`p-3 rounded-lg border ${categoryStyle.bg} ${categoryStyle.border} border-l-4 cursor-pointer hover:shadow-md transition`}
                onClick={() => setShowDetails(!showDetails)}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={handleStatusChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-medium truncate ${task.status === "completed" ? "line-through text-gray-500" : categoryStyle.text}`}>
                            {task.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formattedDeadline}</span>
                            <span>•</span>
                            <span>{ENERGY_ICONS[task.energy_level]} {task.estimated_hours}h</span>
                        </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                        P{task.priority}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`p-4 rounded-lg border ${categoryStyle.bg} ${categoryStyle.border} border-l-4 hover:shadow-md transition`}
        >
            <div className="flex items-start gap-4">
                <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={handleStatusChange}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{categoryStyle.icon}</span>
                        <h3 className={`font-semibold ${task.status === "completed" ? "line-through text-gray-500" : "text-gray-900 dark:text-white"}`}>
                            {task.title}
                        </h3>
                        {task.is_recurring && (
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                                🔄 Recurring
                            </span>
                        )}
                    </div>

                    {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        {/* Category Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${categoryStyle.bg} ${categoryStyle.text}`}>
                            {task.category}
                        </span>

                        {/* Priority Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                            Priority {task.priority}
                        </span>

                        {/* Energy Level */}
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            {ENERGY_ICONS[task.energy_level]} {task.energy_level}
                        </span>

                        {/* Estimated Hours */}
                        <span className="text-gray-600 dark:text-gray-400">
                            ⏱️ {task.estimated_hours}h
                        </span>

                        {/* Deadline */}
                        <span className={`${isOverdue ? "text-red-500 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                            📅 {formattedDeadline}
                            {isOverdue && " (Overdue)"}
                        </span>
                    </div>

                    {/* Deadline Countdown */}
                    <div className={`mt-2 text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-500"}`}>
                        Time remaining: {getTimeUntilDeadline()}
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {task.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        title="View Details"
                    >
                        👁️
                    </button>
                    <button
                        onClick={() => setEditOpen(true)}
                        className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
                        title="Edit Task"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                        title="Delete Task"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {showDetails && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Created:</span>
                            <span className="ml-2 text-gray-700 dark:text-gray-300">
                                {new Date(task.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Status:</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[task.status].bg} ${STATUS_STYLES[task.status].text}`}>
                                {task.status.replace("_", " ")}
                            </span>
                        </div>
                        {task.scheduled_time && (
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Scheduled:</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">
                                    {new Date(task.scheduled_time).toLocaleString()}
                                </span>
                            </div>
                        )}
                        {task.recurring_rule && (
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Recurrence:</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300 capitalize">
                                    {task.recurring_rule}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <EditTaskModal
                task={task}
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                onUpdated={() => { setEditOpen(false); onUpdate(); }}
                onDeleted={() => { setEditOpen(false); onDelete(); }}
            />
        </div>
    );
}
