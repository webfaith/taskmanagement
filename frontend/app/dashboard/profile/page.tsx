"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { UserPreferences } from "@/types/task";
import NotificationsPanel from "@/components/NotificationsPanel";
import Link from "next/link";

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"preferences" | "notifications" | "account">("preferences");

    useEffect(() => {
        if (user) {
            fetchPreferences();
        }
    }, [user]);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getUserPreferences();
            setPreferences(data);
        } catch (err: any) {
            console.error("Failed to fetch preferences:", err);
            // Set default preferences
            setPreferences({
                working_hours_start: "09:00",
                working_hours_end: "17:00",
                energy_pattern: "morning",
                notification_preferences: {
                    email: true,
                    push: true,
                    reminder_minutes: 30,
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        if (!preferences) return;
        try {
            setSaving(true);
            await apiClient.updateUserPreferences(preferences);
        } catch (err: any) {
            console.error("Failed to save preferences:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-2 inline-block">
                                ← Back to Dashboard
                            </Link>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                👤 Profile & Settings
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Manage your account and preferences
                            </p>
                        </div>
                        <NotificationsPanel />
                    </div>
                </header>

                {/* Profile Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                            {user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {user?.name || "User"}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">{user?.email || ""}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Member since {user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab("preferences")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === "preferences"
                                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                    >
                        ⚙️ Preferences
                    </button>
                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === "notifications"
                                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                    >
                        🔔 Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab("account")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === "account"
                                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                    >
                        🔐 Account
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === "preferences" && preferences && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            ⚙️ Schedule Preferences
                        </h3>

                        {/* Working Hours */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Working Hours
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="time"
                                    value={preferences.working_hours_start}
                                    onChange={(e) =>
                                        setPreferences({ ...preferences, working_hours_start: e.target.value })
                                    }
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="time"
                                    value={preferences.working_hours_end}
                                    onChange={(e) =>
                                        setPreferences({ ...preferences, working_hours_end: e.target.value })
                                    }
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Energy Pattern */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                When do you have the most energy?
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { value: "morning", label: "🌅 Morning", desc: "6 AM - 12 PM" },
                                    { value: "afternoon", label: "☀️ Afternoon", desc: "12 PM - 6 PM" },
                                    { value: "evening", label: "🌆 Evening", desc: "6 PM - 12 AM" },
                                    { value: "split", label: "🔀 Split", desc: "Morning & Evening" },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() =>
                                            setPreferences({ ...preferences, energy_pattern: option.value as any })
                                        }
                                        className={`p-3 rounded-lg border text-left transition ${preferences.energy_pattern === option.value
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            }`}
                                    >
                                        <span className="block font-medium text-gray-900 dark:text-white">
                                            {option.label}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {option.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Theme
                            </label>
                            <div className="flex gap-3">
                                <button className="flex-1 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white hover:bg-gray-50 transition">
                                    <span className="text-2xl">☀️</span>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">Light</p>
                                </button>
                                <button className="flex-1 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-900 hover:bg-gray-800 transition">
                                    <span className="text-2xl">🌙</span>
                                    <p className="text-sm font-medium text-white mt-1">Dark</p>
                                </button>
                                <button className="flex-1 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gradient-to-r from-gray-100 to-gray-900 hover:from-gray-200 hover:to-gray-800 transition">
                                    <span className="text-2xl">💻</span>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">System</p>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleSavePreferences}
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Preferences"}
                        </button>
                    </div>
                )}

                {activeTab === "notifications" && preferences && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            🔔 Notification Preferences
                        </h3>

                        {/* Email Notifications */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Receive task reminders and updates via email
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setPreferences({
                                            ...preferences,
                                            notification_preferences: {
                                                ...preferences.notification_preferences,
                                                email: !preferences.notification_preferences.email,
                                            },
                                        })
                                    }
                                    className={`relative w-12 h-6 rounded-full transition-colors ${preferences.notification_preferences.email
                                            ? "bg-blue-600"
                                            : "bg-gray-300 dark:bg-gray-600"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.notification_preferences.email ? "translate-x-6" : ""
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Push Notifications */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Receive browser notifications for deadlines
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setPreferences({
                                            ...preferences,
                                            notification_preferences: {
                                                ...preferences.notification_preferences,
                                                push: !preferences.notification_preferences.push,
                                            },
                                        })
                                    }
                                    className={`relative w-12 h-6 rounded-full transition-colors ${preferences.notification_preferences.push
                                            ? "bg-blue-600"
                                            : "bg-gray-300 dark:bg-gray-600"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.notification_preferences.push ? "translate-x-6" : ""
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Reminder Time */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Default Reminder Time
                            </label>
                            <select
                                value={preferences.notification_preferences.reminder_minutes}
                                onChange={(e) =>
                                    setPreferences({
                                        ...preferences,
                                        notification_preferences: {
                                            ...preferences.notification_preferences,
                                            reminder_minutes: parseInt(e.target.value),
                                        },
                                    })
                                }
                                className="w-full md:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="5">5 minutes before</option>
                                <option value="15">15 minutes before</option>
                                <option value="30">30 minutes before</option>
                                <option value="60">1 hour before</option>
                                <option value="1440">1 day before</option>
                            </select>
                        </div>

                        <button
                            onClick={handleSavePreferences}
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Preferences"}
                        </button>
                    </div>
                )}

                {activeTab === "account" && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            🔐 Account Settings
                        </h3>

                        {/* Account Info */}
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Account Information</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Email</span>
                                    <span className="text-gray-900 dark:text-white">{user?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">User ID</span>
                                    <span className="text-gray-900 dark:text-white text-sm">{user?.$id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Created</span>
                                    <span className="text-gray-900 dark:text-white">
                                        {user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="mb-6 p-4 border border-red-200 dark:border-red-800 rounded-lg">
                            <h4 className="font-medium text-red-600 dark:text-red-400 mb-4">⚠️ Danger Zone</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                                Delete Account
                            </button>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2.5 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
                        >
                            Log Out
                        </button>
                    </div>
                )}

                {/* Quick Navigation */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Link
                        href="/dashboard"
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                        <span className="text-2xl">📋</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-2">Dashboard</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Back to tasks</p>
                    </Link>
                    <Link
                        href="/dashboard/calendar"
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                        <span className="text-2xl">📅</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-2">Calendar</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View calendar</p>
                    </Link>
                    <Link
                        href="/dashboard/schedule"
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                        <span className="text-2xl">⚡</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-2">Schedule</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Optimize your day</p>
                    </Link>
                    <Link
                        href="/dashboard/analytics"
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                        <span className="text-2xl">📊</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-2">Analytics</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View insights</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
