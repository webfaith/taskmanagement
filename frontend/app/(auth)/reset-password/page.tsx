"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PasswordVisibilityToggle } from "@/components/PasswordVisibilityToggle";

export default function ResetPasswordPage() {
    const { requestPasswordReset, completePasswordReset } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userId, setUserId] = useState("");
    const [secret, setSecret] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const nextUserId = params.get("userId") ?? "";
        const nextSecret = params.get("secret") ?? "";

        setUserId(nextUserId);
        setSecret(nextSecret);

        if (nextUserId && nextSecret) {
            setMessage("Enter a new password to complete your reset.");
        }
    }, []);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const redirectUrl = `${window.location.origin}/reset-password`;
            await requestPasswordReset(email, redirectUrl);
            setMessage("We sent a password reset email. Check your inbox and follow the link.");
        } catch (err: any) {
            setError(err.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await completePasswordReset(userId, secret, password);
            setMessage("Password updated successfully. You can now sign in.");
            setPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    const isRecoveryLink = Boolean(userId && secret);

    return (
        <div>
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                {isRecoveryLink ? "Set a new password" : "Reset your password"}
            </h2>

            {isRecoveryLink ? (
                <form className="mt-8 space-y-6" onSubmit={handleCompleteReset}>
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                New password
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white sm:text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <PasswordVisibilityToggle
                                    show={showPassword}
                                    onToggle={() => setShowPassword((current) => !current)}
                                    label="password"
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Confirm password
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    className="block w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white sm:text-sm"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <PasswordVisibilityToggle
                                    show={showConfirmPassword}
                                    onToggle={() => setShowConfirmPassword((current) => !current)}
                                    label="confirm password"
                                />
                            </div>
                        </div>
                    </div>

                    {message && <div className="text-green-600 text-sm text-center">{message}</div>}
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? "Updating..." : "Update password"}
                        </button>
                    </div>
                </form>
            ) : (
                <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enter your account email and we&apos;ll send you a password reset link.
                        </p>
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white sm:text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {message && <div className="text-green-600 text-sm text-center">{message}</div>}
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send reset link"}
                        </button>
                    </div>
                </form>
            )}

            <div className="mt-6 text-center text-sm">
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
