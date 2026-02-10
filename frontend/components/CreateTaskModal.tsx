"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { TaskCategory, TaskPriority, EnergyLevel } from "@/types/task";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated: () => void;
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
    academic: "bg-blue-100 text-blue-700 border-blue-300",
    personal: "bg-green-100 text-green-700 border-green-300",
    work: "bg-purple-100 text-purple-700 border-purple-300",
};

const PRIORITY_LABELS: Record<number, string> = {
    1: "Critical",
    2: "High",
    3: "Medium",
    4: "Low",
    5: "Very Low",
};

const ENERGY_COLORS: Record<EnergyLevel, string> = {
    high: "bg-green-100 text-green-700 border-green-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    low: "bg-red-100 text-red-700 border-red-300",
};

export default function CreateTaskModal({
    isOpen,
    onClose,
    onTaskCreated,
}: CreateTaskModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "academic" as TaskCategory,
        priority: 3 as TaskPriority,
        deadline: "",
        estimated_hours: 1,
        energy_level: "medium" as EnergyLevel,
        tags: "",
        is_recurring: false,
        recurring_rule: "",
        scheduled_time: "",
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const taskData = {
                ...formData,
                tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
                user_id: user?.$id || "",
            };

            await apiClient.createTask(taskData);
            onTaskCreated();
            onClose();
            // Reset form
            setFormData({
                title: "",
                description: "",
                category: "academic",
                priority: 3,
                deadline: "",
                estimated_hours: 1,
                energy_level: "medium",
                tags: "",
                is_recurring: false,
                recurring_rule: "",
                scheduled_time: "",
            });
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Create New Task
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            placeholder="e.g., Study for Math Exam"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition resize-none h-24"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Add details about your task..."
                        />
                    </div>

                    {/* Category and Priority Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition ${CATEGORY_COLORS[formData.category]}`}
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        category: e.target.value as TaskCategory,
                                    })
                                }
                            >
                                <option value="academic">Academic</option>
                                <option value="personal">Personal</option>
                                <option value="work">Work</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Priority <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                value={formData.priority}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        priority: parseInt(e.target.value) as TaskPriority,
                                    })
                                }
                            >
                                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Deadline and Estimated Hours Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Deadline <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                value={formData.deadline}
                                onChange={(e) =>
                                    setFormData({ ...formData, deadline: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Est. Hours <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                required
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                value={formData.estimated_hours}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        estimated_hours: parseFloat(e.target.value),
                                    })
                                }
                            />
                        </div>
                    </div>

                    {/* Energy Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Energy Level <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            {(["high", "medium", "low"] as EnergyLevel[]).map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    className={`flex-1 py-2.5 rounded-lg border font-medium capitalize transition ${formData.energy_level === level
                                            ? ENERGY_COLORS[level]
                                            : "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                                        }`}
                                    onClick={() =>
                                        setFormData({ ...formData, energy_level: level })
                                    }
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tags
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={formData.tags}
                            onChange={(e) =>
                                setFormData({ ...formData, tags: e.target.value })
                            }
                            placeholder="e.g., exam, weekly, important (comma separated)"
                        />
                    </div>

                    {/* Scheduled Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Schedule for Specific Time
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={formData.scheduled_time}
                            onChange={(e) =>
                                setFormData({ ...formData, scheduled_time: e.target.value })
                            }
                        />
                    </div>

                    {/* Recurring */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <input
                            type="checkbox"
                            id="is_recurring"
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={formData.is_recurring}
                            onChange={(e) =>
                                setFormData({ ...formData, is_recurring: e.target.checked })
                            }
                        />
                        <label
                            htmlFor="is_recurring"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            This is a recurring task
                        </label>
                    </div>

                    {formData.is_recurring && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Recurring Rule
                            </label>
                            <select
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                value={formData.recurring_rule}
                                onChange={(e) =>
                                    setFormData({ ...formData, recurring_rule: e.target.value })
                                }
                            >
                                <option value="">Select rule</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {loading ? "Creating..." : "Create Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
