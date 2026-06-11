"use client";

import { useState } from "react";

export default function ManageCategoriesPage() {
    const [categories] = useState([
        { id: "1", name: "Academic", taskCount: 450, color: "bg-blue-500" },
        { id: "2", name: "Personal", taskCount: 320, color: "bg-green-500" },
        { id: "3", name: "Work", taskCount: 200, color: "bg-orange-500" },
        { id: "4", name: "Extracurricular", taskCount: 54, color: "bg-purple-500" },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Categories</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Create and organize task categories.</p>
                </div>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center">
                    <span className="mr-2">+</span> Add Category
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-4 h-4 rounded-full ${category.color} mt-1`}></div>
                                <div className="flex space-x-2">
                                    <button className="text-gray-400 hover:text-blue-500 transition-colors">✏️</button>
                                    <button className="text-gray-400 hover:text-red-500 transition-colors">🗑️</button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{category.name}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">{category.taskCount} tasks currently using this category.</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
