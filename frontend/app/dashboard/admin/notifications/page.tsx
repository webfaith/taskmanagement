"use client";

import { useState } from "react";

export default function SendNotificationsPage() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [target, setTarget] = useState("all");
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        // Mock sending action
        setTimeout(() => {
            setIsSending(false);
            setSent(true);
            setTitle("");
            setMessage("");
            setTimeout(() => setSent(false), 3000);
        }, 1000);
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send Notifications</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Broadcast important updates or alerts to users.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <form onSubmit={handleSend} className="space-y-6">
                    <div>
                        <label htmlFor="target-audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Target Audience
                        </label>
                        <select
                            id="target-audience"
                            name="target-audience"
                            title="Target Audience"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white p-2.5 border"
                        >
                            <option value="all">All Users</option>
                            <option value="active">Active Users Only</option>
                            <option value="admins">Administrators Only</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notification Title
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Scheduled Maintenance"
                            className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white p-2.5 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Message
                        </label>
                        <textarea
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            placeholder="Type your notification message here..."
                            className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white p-2.5 border resize-none"
                        ></textarea>
                    </div>

                    {sent && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg flex items-center">
                            <span className="mr-2">✅</span> Notification sent successfully!
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSending || !title || !message}
                            className={`px-6 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center ${isSending || !title || !message
                                ? "bg-orange-400 cursor-not-allowed"
                                : "bg-orange-600 hover:bg-orange-700 shadow-sm"
                                }`}
                        >
                            {isSending ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <span className="mr-2">🚀</span> Send Notification
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
