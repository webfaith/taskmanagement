"use client";

import { useState, useEffect } from "react";
import { Task, TaskCategory, TaskPriority, EnergyLevel, TaskStatus } from "@/types/task";
import apiClient from "@/lib/api";

interface EditTaskModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    onDeleted: () => void;
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
    1: { label: "1 – Critical", color: "text-red-600" },
    2: { label: "2 – High", color: "text-orange-500" },
    3: { label: "3 – Medium", color: "text-yellow-500" },
    4: { label: "4 – Low", color: "text-green-500" },
    5: { label: "5 – Very Low", color: "text-gray-400" },
};

const ENERGY_COLORS: Record<EnergyLevel, string> = {
    high: "bg-green-100 text-green-700 border-green-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    low: "bg-red-100 text-red-700 border-red-300",
};

function toDatetimeLocal(isoString: string): string {
    try {
        const d = new Date(isoString);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return "";
    }
}

export default function EditTaskModal({ task, isOpen, onClose, onUpdated, onDeleted }: EditTaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [formData, setFormData] = useState({
        title: task.title,
        description: task.description || "",
        category: task.category as TaskCategory,
        deadline: toDatetimeLocal(task.deadline as unknown as string),
        estimated_hours: task.estimated_hours,
        energy_level: task.energy_level as EnergyLevel,
        status: task.status as TaskStatus,
        tags: Array.isArray(task.tags) ? task.tags.join(", ") : "",
        is_recurring: task.is_recurring,
        recurring_rule: task.recurring_rule || "",
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: task.title,
                description: task.description || "",
                category: task.category as TaskCategory,
                deadline: toDatetimeLocal(task.deadline as unknown as string),
                estimated_hours: task.estimated_hours,
                energy_level: task.energy_level as EnergyLevel,
                status: task.status as TaskStatus,
                tags: Array.isArray(task.tags) ? task.tags.join(", ") : "",
                is_recurring: task.is_recurring,
                recurring_rule: task.recurring_rule || "",
            });
            setError("");
            setConfirmDelete(false);
        }
    }, [isOpen, task]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await apiClient.updateTask(task.id, {
                ...formData,
                tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
                deadline: new Date(formData.deadline).toISOString(),
            });
            onUpdated();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update task");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        setDeleting(true);
        try {
            await apiClient.deleteTask(task.id);
            onDeleted();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to delete task");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Task</h3>
                        <p className="text-xs text-gray-400 mt-0.5">AI will reassign priority on save</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-700">
                            {error}
                        </div>
                    )}

                    {/* AI Priority preview */}
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        <span className="text-indigo-500 text-lg">🤖</span>
                        <div>
                            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Current AI Priority</p>
                            <p className={`text-sm font-bold ${PRIORITY_LABELS[task.priority]?.color}`}>
                                {PRIORITY_LABELS[task.priority]?.label || `P${task.priority}`}
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 ml-auto">Recalculated on save</p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none h-20"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Category + Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                            >
                                <option value="academic">Academic</option>
                                <option value="personal">Personal</option>
                                <option value="work">Work</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Deadline + Hours */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline <span className="text-red-500">*</span></label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.deadline}
                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Est. Hours</label>
                            <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.estimated_hours}
                                onChange={e => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Energy Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Energy Level</label>
                        <div className="flex gap-2">
                            {(["high", "medium", "low"] as EnergyLevel[]).map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    className={`flex-1 py-2 rounded-lg border font-medium capitalize text-sm transition ${formData.energy_level === level
                                            ? ENERGY_COLORS[level]
                                            : "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                                        }`}
                                    onClick={() => setFormData({ ...formData, energy_level: level })}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="tag1, tag2, tag3"
                        />
                    </div>

                    {/* Footer: Delete + Save */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${confirmDelete
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "text-red-500 border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                } disabled:opacity-50`}
                        >
                            {deleting ? "Deleting..." : confirmDelete ? "Confirm Delete" : "🗑 Delete"}
                        </button>
                        {confirmDelete && (
                            <button type="button" onClick={() => setConfirmDelete(false)} className="text-sm text-gray-400 hover:text-gray-600">
                                Cancel
                            </button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
