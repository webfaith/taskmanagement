"use client";

import { useEffect, useState, useRef } from "react";
import apiClient from "@/lib/api";
import { Notification } from "@/types/task";

const TYPE_ICONS: Record<string, string> = {
    reminder: "⏰",
    deadline: "⚠️",
    progress: "📈",
    alert: "🔔",
};

const TYPE_COLORS: Record<string, string> = {
    reminder: "text-blue-500",
    deadline: "text-red-500",
    progress: "text-green-500",
    alert: "text-amber-500",
};

export default function NotificationsPanel() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingAll, setLoadingAll] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const fetchAll = async () => {
        try {
            const [notifs, { count }] = await Promise.all([
                apiClient.getNotifications(),
                apiClient.getUnreadCount(),
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    // Fetch on mount, generate reminders, then auto-poll every 60s
    useEffect(() => {
        fetchAll();
        // Generate reminders on load (fire-and-forget)
        apiClient.generateReminders().catch(() => { });

        const interval = setInterval(() => {
            fetchAll();
            apiClient.generateReminders().catch(() => { });
        }, 60_000);

        return () => clearInterval(interval);
    }, []);

    // Close panel on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleMarkRead = async (id: string) => {
        try {
            await apiClient.markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const handleMarkAllRead = async () => {
        setLoadingAll(true);
        try {
            await apiClient.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        } finally {
            setLoadingAll(false);
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none"
                aria-label="Notifications"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="ml-2 text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={loadingAll}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                            >
                                {loadingAll ? "Clearing..." : "Mark all read"}
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-2xl mb-1">🔔</p>
                                <p className="text-sm text-gray-400">No notifications</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${!notif.read ? "bg-indigo-50/40 dark:bg-indigo-900/10" : ""
                                        }`}
                                    onClick={() => !notif.read && handleMarkRead(notif.id)}
                                >
                                    <span className={`text-base mt-0.5 flex-shrink-0 ${TYPE_COLORS[notif.type] || "text-gray-400"}`}>
                                        {TYPE_ICONS[notif.type] || "🔔"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${!notif.read ? "text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">
                                            {notif.message}
                                        </p>
                                        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                                            {timeAgo(notif.created_at)}
                                        </p>
                                    </div>
                                    {!notif.read && (
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-center">
                            <p className="text-xs text-gray-400">
                                {notifications.length} notification{notifications.length !== 1 ? "s" : ""} total · Auto-refreshes every 60s
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
