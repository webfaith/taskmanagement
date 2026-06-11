"use client";

export default function GenerateReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Generate Reports</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Export system-wide analytics and productivity metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">User Engagement Report</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Download a summary of active users, session durations, and login frequencies over a specific period.</p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="time-range" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Range</label>
                            <select id="time-range" className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white p-2 border">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>This Month</option>
                                <option>Last Month</option>
                                <option>All Time</option>
                            </select>
                        </div>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Task Completion Analytics</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Detailed breakdown of task completion rates, categories, and average time spent on tasks.</p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Filter</label>
                            <select id="category-filter" className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white p-2 border">
                                <option>All Categories</option>
                                <option>Academic</option>
                                <option>Work</option>
                                <option>Personal</option>
                            </select>
                        </div>
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                            Generate PDF Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
