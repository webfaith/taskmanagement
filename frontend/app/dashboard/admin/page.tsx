"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeGroups: 0,
        tasksCreated: 0,
    });

    useEffect(() => {
        // Fetch some high level stats, for now mock data
        setStats({
            totalUsers: 42,
            activeGroups: 15,
            tasksCreated: 1024,
        });
    }, []);

    const adminModules = [
        {
            name: "Monitor Users",
            description: "View user activity, roles, and status.",
            href: "/dashboard/admin/users",
            icon: "👥",
            color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        },
        {
            name: "Manage Categories",
            description: "Create or modify task categories and labels.",
            href: "/dashboard/admin/categories",
            icon: "📁",
            color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        },
        {
            name: "Generate Reports",
            description: "System-wide productivity and engagement metrics.",
            href: "/dashboard/admin/reports",
            icon: "📊",
            color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
        },
        {
            name: "Send Notifications",
            description: "Broadcast messages or targeted alerts to users.",
            href: "/dashboard/admin/notifications",
            icon: "🔔",
            color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">System overview and administrative tools.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUsers}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Groups</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.activeGroups}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Created</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.tasksCreated}</p>
                </div>
            </div>

            {/* Modules Grid */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Management Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adminModules.map((module) => (
                    <Link
                        key={module.name}
                        href={module.href}
                        className="flex items-start p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group"
                    >
                        <div className={`p-4 rounded-lg mr-4 ${module.color}`}>
                            <span className="text-2xl">{module.icon}</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {module.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                                {module.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
