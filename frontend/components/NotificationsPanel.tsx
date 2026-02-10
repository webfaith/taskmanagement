"use client";

import { useState, useEffect, useRef } from "react";
import { Notification } from "@/types/task";
import apiClient from "@/lib/api";

interface NotificationsPanelProps {
    onNotificationClick?: (notification: Notification) => void;
}

const NOTIFICATION_ICONS: Record<string, string> = {
    deadline: "⏰",
    reminder: "🔔",
    progress: "📈",
    system: "⚙️",
};

const NOTIFICATION_COLORS: Record<string, string> = {
    deadline: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    reminder: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    progress: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    system: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function NotificationsPanel({ onNotificationClick }: NotificationsPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        // Set up polling for new notifications
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        // Close panel when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            clearInterval(interval);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await apiClient.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const data = await apiClient.getUnreadCount();
            setUnreadCount(data.count);
        } catch (error) {
            console.error("Failed to fetch unread count:", error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await apiClient.markNotificationRead(id);
            setNotifications(
                notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount(Math.max(0, unreadCount - 1));
            if (onNotificationClick) {
                const notification = notifications.find((n) => n.id === id);
                if (notification) onNotificationClick(notification);
            }
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            await apiClient.markAllNotificationsRead();
            setNotifications(notifications.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        } finally {
            setLoading(false);
        }
    };

    const groupNotifications = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const grouped: Record<string, Notification[]> = {
            today: [],
            yesterday: [],
            older: [],
        };

        notifications.forEach((notification) => {
            const notifDate = new Date(notification.created_at);
            if (notifDate >= today) {
                grouped.today.push(notification);
            } else if (notifDate >= yesterday) {
                grouped.yesterday.push(notification);
            } else {
                grouped.older.push(notification);
            }
        });

        return grouped;
    };

    const grouped = groupNotifications();

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                disabled={loading}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <span className="text-4xl">🔕</span>
                                <p className="mt-2">No notifications yet</p>
                            </div>
                        ) : (
                            <>
                                {grouped.today.length > 0 && (
                                    <div className="p-2">
                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-2">
                                            Today
                                        </h4>
                                        {grouped.today.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onMarkAsRead={handleMarkAsRead}
                                            />
                                        ))}
                                    </div>
                                )}

                                {grouped.yesterday.length > 0 && (
                                    <div className="p-2">
                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-2">
                                            Yesterday
                                        </h4>
                                        {grouped.yesterday.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onMarkAsRead={handleMarkAsRead}
                                            />
                                        ))}
                                    </div>
                                )}

                                {grouped.older.length > 0 && (
                                    <div className="p-2">
                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-2">
                                            Earlier
                                        </h4>
                                        {grouped.older.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onMarkAsRead={handleMarkAsRead}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                        >
                            View all notifications →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const icon = NOTIFICATION_ICONS[notification.type] || "📢";
    const colorClass = NOTIFICATION_COLORS[notification.type] || "bg-gray-100 text-gray-700";

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div
            className={`p-3 rounded-lg mb-2 cursor-pointer transition ${notification.read
                    ? "bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                }`}
            onClick={() => !notification.read && onMarkAsRead(notification.id)}
        >
            <div className="flex items-start gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${colorClass}`}>
                    {icon}
                </span>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${notification.read ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                        {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {formatTime(notification.created_at)}
                    </p>
                </div>
                {!notification.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                )}
            </div>
        </div>
    );
}
