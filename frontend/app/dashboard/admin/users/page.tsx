"use client";

import { useState } from "react";

export default function MonitorUsersPage() {
    // Mock user data
    const [users] = useState([
        { id: "1", name: "Alice Johnson", email: "alice@example.com", role: "User", status: "Active", lastLogin: "2023-10-25 10:30 AM" },
        { id: "2", name: "Bob Smith", email: "bob@example.com", role: "User", status: "Inactive", lastLogin: "2023-10-20 02:15 PM" },
        { id: "3", name: "Admin Verify", email: "digitalverify23@gmail.com", role: "Admin", status: "Active", lastLogin: "2023-10-26 09:00 AM" },
        { id: "4", name: "Peter Kehinde", email: "peterkehindeademola@gmail.com", role: "Admin", status: "Active", lastLogin: "2023-10-26 08:45 AM" },
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monitor Users</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage user accounts across the platform.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">User Directory</h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Last Login</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{user.lastLogin}</td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm mr-3">Edit</button>
                                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm">Disable</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
