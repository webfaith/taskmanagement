"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import apiClient from "@/lib/api";
import { Group, Task, TaskCategory, TaskStatus } from "@/types/task";
import CalendarView from "@/components/CalendarView";
import NotificationsPanel from "@/components/NotificationsPanel";
import Link from "next/link";

export default function SharedCalendarPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [allGroupTasks, setAllGroupTasks] = useState<GroupTaskItem[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [loading, setLoading] = useState(true);

    interface GroupTaskItem {
        id: string;
        title: string;
        deadline: string;
        groupId: string;
        groupName: string;
        assignedTo: string[];
        progress: number;
        status: string;
        category: string;
        estimated_hours: number;
    }

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const groupsData = await apiClient.getGroups();

            setGroups(groupsData);
            if (groupsData.length > 0 && !selectedGroupId) {
                setSelectedGroupId(groupsData[0].id);
            }

            // Load group tasks for all accessible groups in parallel
            const taskPromises = groupsData.map((g) =>
                apiClient.getGroupTasks(g.id).catch(() => [])
            );
            const results = await Promise.all(taskPromises);

            // Load actual task details for each group task
            const enriched: GroupTaskItem[] = [];
            for (let i = 0; i < groupsData.length; i++) {
                const group = groupsData[i];
                const groupTaskDocs = results[i] || [];
                for (const gt of groupTaskDocs) {
                    try {
                        const task = await apiClient.getTask(gt.task_id);
                        enriched.push({
                            id: gt.id,
                            title: task.title,
                            deadline: task.deadline,
                            groupId: group.id,
                            groupName: group.name,
                            assignedTo: gt.assigned_to,
                            progress: gt.progress,
                            status: task.status,
                            category: task.category,
                            estimated_hours: task.estimated_hours,
                        });
                    } catch {
                        // Skip tasks we can't resolve
                    }
                }
            }
            setAllGroupTasks(enriched);
        } catch (err) {
            console.error("Failed to load shared calendar:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedGroupId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const visibleTasks = useMemo(() => {
        if (!selectedGroupId) return allGroupTasks;
        return allGroupTasks.filter((t) => t.groupId === selectedGroupId);
    }, [allGroupTasks, selectedGroupId]);

    // Adapt group-task items into the shape CalendarView expects (Task-like)
    const calendarTasks = useMemo<Task[]>(() => {
        return visibleTasks.map((t) => ({
            id: t.id,
            title: `[${t.groupName}] ${t.title}`,
            description: `Assigned to ${t.assignedTo.length} member(s) · ${t.progress.toFixed(0)}% done`,
            category: t.category as TaskCategory,
            priority: 3,
            deadline: t.deadline,
            estimated_hours: t.estimated_hours,
            energy_level: "medium" as const,
            status: t.status as TaskStatus,
            created_at: "",
            user_id: "",
            tags: [],
            is_recurring: false,
            scheduled_time: undefined,
            priority_reason: undefined,
        }));
    }, [visibleTasks]);

    // Build a human-readable legend for the selected group
    const groupTasksWithDates = useMemo(() => {
        return visibleTasks.map((t) => {
            const d = t.deadline ? (() => { const dt = new Date(t.deadline); return isNaN(dt.getTime()) ? null : dt; })() : null;
            return {
                ...t,
                dateLabel: d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No date",
                _deadlineTime: d ? d.getTime() : 0,
            };
        }).sort((a, b) => (a._deadlineTime || 0) - (b._deadlineTime || 0));
    }, [visibleTasks]);

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
                                📅 Shared Group Calendar
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                See upcoming group task deadlines across all your study groups
                            </p>
                        </div>
                        <NotificationsPanel />
                    </div>
                </header>

                {/* Group Filter */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Filter by group:
                        </label>
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">All groups</option>
                            {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name} ({g.member_ids.length} members)
                                </option>
                            ))}
                        </select>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {visibleTasks.length} group task{visibleTasks.length !== 1 ? "s" : ""} shown
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                        <span className="text-4xl">👥</span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                            No groups yet
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Create a group first, then view deadlines together here.
                        </p>
                        <Link
                            href="/dashboard/groups"
                            className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Create Group
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Shared Calendar View */}
                        <CalendarView
                            tasks={calendarTasks}
                            onDateClick={(date) => {
                                const dayTasks = visibleTasks.filter((t) => {
                                    const d = t.deadline ? new Date(t.deadline) : null;
                                    return d && !isNaN(d.getTime()) &&
                                        d.getFullYear() === date.getFullYear() &&
                                        d.getMonth() === date.getMonth() &&
                                        d.getDate() === date.getDate();
                                });
                                if (dayTasks.length > 0) {
                                    alert(
                                        dayTasks.map((t) => `[${t.groupName}] ${t.title} – ${t.progress.toFixed(0)}% done`).join("\n")
                                    );
                                }
                            }}
                        />

                        {/* Group Task List — below calendar */}
                        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Group Tasks — Upcoming Deadlines
                                </h3>
                            </div>
                            {groupTasksWithDates.length === 0 ? (
                                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No group tasks with deadlines yet. Assign a task to a group member to see it here.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {groupTasksWithDates.map((t) => (
                                        <div key={t.id} className="px-5 py-3 flex flex-wrap items-center gap-4">
                                            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-24 shrink-0">
                                                {t.dateLabel}
                                            </span>
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 min-w-0 truncate">
                                                {t.title}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                {t.groupName}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {t.assignedTo.length} member{t.assignedTo.length !== 1 ? "s" : ""}
                                            </span>
                                            <div className="w-16">
                                                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${t.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-10 text-right">
                                                {t.progress.toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
