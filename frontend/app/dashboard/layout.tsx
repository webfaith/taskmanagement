"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [evaluationOpen, setEvaluationOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: "📊" },
        { name: "Calendar", href: "/dashboard/calendar", icon: "📅" },
        { name: "Schedule", href: "/dashboard/schedule", icon: "⚡" },
        { name: "Analytics", href: "/dashboard/analytics", icon: "📈" },
    ];

    const evaluationItems = [
        { name: "Overview", href: "/dashboard/evaluation", icon: "📊" },
        { name: "Weekly Survey", href: "/dashboard/evaluation/survey", icon: "📝" },
        { name: "Research Export", href: "/dashboard/evaluation/export", icon: "📤" },
        { name: "Success Stories", href: "/dashboard/evaluation/stories", icon: "📖" },
    ];

    const isEvaluationActive = pathname.startsWith('/dashboard/evaluation');
    const isMobileEvaluationActive = evaluationItems.some(item => pathname === item.href);

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex-shrink-0 hidden md:block relative">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">📋 TaskFlow</h1>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                <span className="mr-3">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}

                    {/* Evaluation Dropdown */}
                    <div className="mt-4">
                        <button
                            onClick={() => setEvaluationOpen(!evaluationOpen)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isEvaluationActive
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                        >
                            <div className="flex items-center">
                                <span className="mr-3">🎯</span>
                                <span className="font-medium">Evaluation</span>
                            </div>
                            <span className={`transition-transform ${evaluationOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {evaluationOpen && (
                            <div className="mt-2 ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                                {evaluationItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                }`}
                                        >
                                            <span className="mr-2">{item.icon}</span>
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <Link
                        href="/dashboard/profile"
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${pathname === "/dashboard/profile"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                    >
                        <span className="mr-3">👤</span>
                        <span className="font-medium">Profile</span>
                    </Link>

                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-8"
                    >
                        <span className="mr-3">🚪</span>
                        <span className="font-medium">Logout</span>
                    </button>
                </nav>

                {/* User Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user?.name || "User"}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email || ""}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {/* Mobile Header */}
                <div className="md:hidden flex justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <h1 className="text-lg font-bold">📋 TaskFlow</h1>
                    <button onClick={() => logout()} className="text-sm text-red-500">Logout</button>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 z-50">
                    <div className="flex justify-around">
                        {navItems.slice(0, 4).map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center px-3 py-2 rounded-lg ${isActive
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400"
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-xs mt-1">{item.name}</span>
                                </Link>
                            );
                        })}
                        {/* Mobile Evaluation Link */}
                        <Link
                            href="/dashboard/evaluation"
                            className={`flex flex-col items-center px-3 py-2 rounded-lg ${isMobileEvaluationActive
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            <span className="text-xl">🎯</span>
                            <span className="text-xs mt-1">Evaluation</span>
                        </Link>
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
}
