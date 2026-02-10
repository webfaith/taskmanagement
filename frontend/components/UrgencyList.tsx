"use client";

import { useMemo } from "react";
import { Task } from "@/types/task";
import TaskCard from "./TaskCard";

interface UrgencyListProps {
    tasks: Task[];
    onUpdate: () => void;
    onDelete: () => void;
    limit?: number;
}

export default function UrgencyList({ tasks, onUpdate, onDelete, limit = 5 }: UrgencyListProps) {
    const urgentTasks = useMemo(() => {
        const now = new Date();

        // Score each task based on priority and time until deadline
        const scored = tasks
            .filter((task) => task.status !== "completed")
            .map((task) => {
                const deadline = new Date(task.deadline);
                const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
                const daysUntilDeadline = hoursUntilDeadline / 24;

                // Higher priority (lower number) = higher urgency score
                // Closer deadline = higher urgency score
                // Priority weight: 50%, Time weight: 50%
                let urgencyScore = 0;

                if (hoursUntilDeadline <= 0) {
                    // Overdue - maximum urgency
                    urgencyScore = 1000;
                } else if (hoursUntilDeadline <= 6) {
                    urgencyScore = 800 + (6 - hoursUntilDeadline) * 10;
                } else if (hoursUntilDeadline <= 24) {
                    urgencyScore = 600 + (24 - hoursUntilDeadline) * 5;
                } else if (daysUntilDeadline <= 3) {
                    urgencyScore = 400 + (3 - daysUntilDeadline) * 50;
                } else if (daysUntilDeadline <= 7) {
                    urgencyScore = 200 + (7 - daysUntilDeadline) * 30;
                } else {
                    urgencyScore = 100;
                }

                // Add priority factor (1 = highest priority)
                const priorityFactor = (6 - task.priority) * 20;
                urgencyScore += priorityFactor;

                return { task, urgencyScore, hoursUntilDeadline };
            })
            .sort((a, b) => b.urgencyScore - a.urgencyScore)
            .slice(0, limit);

        return scored;
    }, [tasks, limit]);

    if (urgentTasks.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🚨</span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Most Urgent
                    </h3>
                </div>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <span className="text-4xl">🎉</span>
                    <p className="mt-2">All caught up! No urgent tasks.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🚨</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Most Urgent
                </h3>
                <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                    Top {urgentTasks.length}
                </span>
            </div>

            <div className="space-y-3">
                {urgentTasks.map(({ task, hoursUntilDeadline }) => (
                    <div key={task.id}>
                        <TaskCard
                            task={task}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            compact
                        />
                        {/* Urgency indicator */}
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            {hoursUntilDeadline <= 0 && (
                                <span className="text-red-500 font-medium flex items-center gap-1">
                                    ⚠️ Overdue
                                </span>
                            )}
                            {hoursUntilDeadline > 0 && hoursUntilDeadline <= 6 && (
                                <span className="text-orange-500 font-medium flex items-center gap-1">
                                    🔥 Due in {Math.round(hoursUntilDeadline)} hours
                                </span>
                            )}
                            {hoursUntilDeadline > 6 && hoursUntilDeadline <= 24 && (
                                <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                    ⏰ Due in {Math.round(hoursUntilDeadline)} hours
                                </span>
                            )}
                            {hoursUntilDeadline > 24 && (
                                <span className="text-blue-500 flex items-center gap-1">
                                    📅 Due in {Math.round(hoursUntilDeadline / 24)} days
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
