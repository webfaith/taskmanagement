"use client";

import { useState } from "react";
import { Task } from "@/types/task";
import apiClient from "@/lib/api";

interface ImportTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImported: (tasks: Partial<Task>[]) => void;
}

export default function ImportTasksModal({ isOpen, onClose, onImported }: ImportTasksModalProps) {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [parsedTasks, setParsedTasks] = useState<Partial<Task>[] | null>(null);

    if (!isOpen) return null;

    const handleAnalyze = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const response = await apiClient.parseDocument(text);
            setParsedTasks(response.tasks);
        } catch (error) {
            console.error("Failed to parse document:", error);
            alert("Failed to extract tasks. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleImportAll = () => {
        if (parsedTasks) {
            onImported(parsedTasks);
            handleClose();
        }
    };

    const handleClose = () => {
        setText("");
        setParsedTasks(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import from Syllabus</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        ✕
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {!parsedTasks ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                                Paste the text from your syllabus or assignment document below. Our AI will automatically extract the tasks, deadlines, and estimate the required effort.
                            </p>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste your syllabus text here..."
                                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                            ></textarea>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading || !text.trim()}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? "Analyzing..." : "✨ Analyze Document"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                    Found {parsedTasks.length} Task{parsedTasks.length !== 1 ? 's' : ''}
                                </h3>
                                <button
                                    onClick={() => setParsedTasks(null)}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    Try another document
                                </button>
                            </div>

                            {parsedTasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No tasks found in the provided text.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {parsedTasks.map((task, idx) => (
                                        <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                                                {task.deadline && (
                                                    <span className="text-xs text-red-500 font-medium">
                                                        📅 {new Date(task.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            {task.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                            )}
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 capitalize">
                                                    {task.category || "Unknown"}
                                                </span>
                                                {task.estimated_hours && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                                        ⏱️ {task.estimated_hours}h
                                                    </span>
                                                )}
                                                {task.energy_level && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 capitalize">
                                                        ⚡ {task.energy_level}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImportAll}
                                    disabled={parsedTasks.length === 0}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    Import All Tasks
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
