"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";

export default function GoogleCalendarCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loading } = useAuth();
    const [message, setMessage] = useState("Completing Google Calendar connection...");

    useEffect(() => {
        const connect = async () => {
            const code = searchParams.get("code");
            const error = searchParams.get("error");

            if (error) {
                setMessage(`Google returned an error: ${error}`);
                return;
            }

            if (!code) {
                setMessage("Missing authorization code.");
                return;
            }

            if (loading) {
                return;
            }

            try {
                const redirectUri = `${window.location.origin}/google/callback`;
                await apiClient.connectGoogleCalendar(code, redirectUri);
                router.replace("/dashboard/profile");
            } catch (err) {
                console.error("Failed to connect Google Calendar:", err);
                setMessage("We could not finish connecting Google Calendar. Please try again.");
            }
        };

        connect();
    }, [loading, router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Google Calendar</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
            </div>
        </div>
    );
}
