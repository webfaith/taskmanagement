"use client";

import { useState, useMemo } from "react";
import { Task, TaskFilters, TaskStatus, TaskCategory, TaskPriority } from "@/types/task";
import TaskCard from "./TaskCard";

interface TaskListProps {
    tasks: Task[];
    onUpdate: () => void;
    onDelete: () => void;
    showFilters?: boolean;
    compact?: boolean;
}

type SortOption = "priority" | "deadline" | "created" | "title";
type ViewMode = "list" | "compact" | "cards";

export default function TaskList({
    tasks,
    onUpdate,
    onDelete,
    showFilters = true,
    compact = false,
}: TaskListProps) {
    const [filters, setFilters] = useState<TaskFilters>({
        status: undefined,
        category: undefined,
        priority: undefined,
        search: "",
    });
    const [sortBy, setSortBy] = useState<SortOption>("priority");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [viewMode, setViewMode] = useState<ViewMode>(compact ? "compact" : "list");

    // Filter and sort tasks
    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        // Apply filters
        if (filters.status) {
            result = result.filter((task) => task.status === filters.status);
        }
        if (filters.category) {
            result = result.filter((task) => task.category === filters.category);
        }
        if (filters.priority) {
            result = result.filter((task) => task.priority === filters.priority);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(
                (task) =>
                    task.title.toLowerCase().includes(search) ||
                    task.description?.toLowerCase().includes(search) ||
                    task.tags?.some((tag) => tag.toLowerCase().includes(search))
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "priority":
                    comparison = a.priority - b.priority;
                    break;
                case "deadline":
                    comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                    break;
                case "created":
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
                case "title":
                    comparison = a.title.localeCompare(b.title);
                    break;
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return result;
    }, [tasks, filters, sortBy, sortOrder]);

    const clearFilters = () => {
        setFilters({
            status: undefined,
            category: undefined,
            priority: undefined,
            search: "",
        });
    };

    const hasActiveFilters = useMemo(
        () =>
            filters.status !== undefined ||
            filters.category !== undefined ||
            filters.priority !== undefined ||
            filters.search !== "",
        [filters]
    );

    return (
        <div className="space-y-4">
            {/* Filters and Controls */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={filters.search || ""}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filters.status || ""}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    status: e.target.value ? (e.target.value as TaskStatus) : undefined,
                                })
                            }
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={filters.category || ""}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    category: e.target.value ? (e.target.value as TaskCategory) : undefined,
                                })
                            }
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">All Categories</option>
                            <option value="academic">Academic</option>
                            <option value="personal">Personal</option>
                            <option value="work">Work</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={filters.priority || ""}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    priority: e.target.value ? (parseInt(e.target.value) as TaskPriority) : undefined,
                                })
                            }
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">All Priorities</option>
                            <option value="1">Priority 1 (Critical)</option>
                            <option value="2">Priority 2 (High)</option>
                            <option value="3">Priority 3 (Medium)</option>
                            <option value="4">Priority 4 (Low)</option>
                            <option value="5">Priority 5 (Very Low)</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="priority">Sort by Priority</option>
                            <option value="deadline">Sort by Deadline</option>
                            <option value="created">Sort by Created</option>
                            <option value="title">Sort by Title</option>
                        </select>

                        {/* Sort Order Toggle */}
                        <button
                            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                            title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
                        >
                            {sortOrder === "asc" ? "↑" : "↓"}
                        </button>

                        {/* View Mode Toggle */}
                        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-3 py-2 ${viewMode === "list" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
                                title="List View"
                            >
                                ☰
                            </button>
                            <button
                                onClick={() => setViewMode("compact")}
                                className={`px-3 py-2 ${viewMode === "compact" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
                                title="Compact View"
                            >
                                ▤
                            </button>
                            <button
                                onClick={() => setViewMode("cards")}
                                className={`px-3 py-2 ${viewMode === "cards" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
                                title="Card View"
                            >
                                ▦
                            </button>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        Showing {filteredTasks.length} of {tasks.length} tasks
                        {hasActiveFilters && " (filtered)"}
                    </div>
                </div>
            )}

            {/* Task List */}
            <div className={viewMode === "cards" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            compact={viewMode === "compact"}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <div className="text-4xl mb-4">📋</div>
                        <p className="text-lg font-medium">No tasks found</p>
                        <p className="text-sm">
                            {hasActiveFilters
                                ? "Try adjusting your filters or create a new task."
                                : "Create your first task to get started!"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
