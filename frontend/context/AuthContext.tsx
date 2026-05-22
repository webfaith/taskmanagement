"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { account, isAppwriteConfigured } from "@/lib/appwrite";
import apiClient from "@/lib/api";
import { ID, Models } from "appwrite";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    userId: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    requestPasswordReset: (email: string, redirectUrl: string) => Promise<void>;
    completePasswordReset: (userId: string, secret: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        if (!isAppwriteConfigured) {
            console.warn("[AuthContext] Appwrite not configured - using demo mode");
            setUser(null);
            setUserId(null);
            setLoading(false);
            return;
        }

        try {
            console.log("[AuthContext] Checking user status...");
            const currentUser = await account.get();
            console.log("[AuthContext] User found:", currentUser.$id);
            setUser(currentUser);
            setUserId(currentUser.$id);
            if (typeof window !== 'undefined') {
                localStorage.setItem('user_id', currentUser.$id);
                localStorage.setItem('user_email', currentUser.email);
            }
            // Initialize API client with user info
            apiClient.setUserId(currentUser.$id);
            
            // Try to get a JWT for secure backend communication
            try {
                const session = await account.createJWT();
                apiClient.setToken(session.jwt);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('auth_token', session.jwt);
                }
            } catch (jwtError) {
                console.warn("[AuthContext] Could not generate JWT:", jwtError);
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("[AuthContext] Error checking user status:", errorMsg);
            
            // Check if this is an Appwrite permission error
            if (errorMsg.includes("missing scopes") || errorMsg.includes("unauthorized")) {
                console.warn("[AuthContext] Appwrite permission error - user is not logged in");
            }
            
            setUser(null);
            setUserId(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        if (!isAppwriteConfigured) {
            throw new Error("Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID.");
        }

        try {
            console.log("[AuthContext] Attempting login for:", email);
            
            // Logout any existing session before creating a new one
            try {
                await account.deleteSession("current");
            } catch {
                // No active session to delete
            }
            
            console.log("[AuthContext] Creating email/password session...");
            await account.createEmailPasswordSession(email, password);
            
            console.log("[AuthContext] Fetching user data...");
            const currentUser = await account.get();
            setUser(currentUser);
            setUserId(currentUser.$id);
            if (typeof window !== 'undefined') {
                localStorage.setItem('user_id', currentUser.$id);
                localStorage.setItem('user_email', currentUser.email);
            }
            
            // Initialize API client with user info
            apiClient.setUserId(currentUser.$id);
            
            // Generate JWT
            try {
                console.log("[AuthContext] Generating JWT...");
                const session = await account.createJWT();
                apiClient.setToken(session.jwt);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('auth_token', session.jwt);
                }
            } catch (jwtError) {
                console.warn("[AuthContext] Could not generate JWT:", jwtError);
            }
            
            console.log("[AuthContext] Login successful, redirecting to dashboard...");
            router.push("/dashboard");
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("[AuthContext] Login error:", errorMsg);
            throw error;
        }
    };

    const register = async (email: string, password: string, name: string) => {
        if (!isAppwriteConfigured) {
            throw new Error("Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID.");
        }

        try {
            console.log("[AuthContext] Creating user account for:", email);
            await account.create(ID.unique(), email, password, name);
            console.log("[AuthContext] Account created, attempting login...");
            await login(email, password);
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("[AuthContext] Registration error:", errorMsg);
            throw error;
        }
    };

    const requestPasswordReset = async (email: string, redirectUrl: string) => {
        if (!isAppwriteConfigured) {
            throw new Error("Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID.");
        }

        try {
            console.log("[AuthContext] Requesting password reset for:", email);
            await account.createRecovery(email, redirectUrl);
            console.log("[AuthContext] Password reset email sent");
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("[AuthContext] Password reset error:", errorMsg);
            throw error;
        }
    };

    const completePasswordReset = async (userId: string, secret: string, password: string) => {
        if (!isAppwriteConfigured) {
            throw new Error("Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID.");
        }

        try {
            console.log("[AuthContext] Completing password reset for user:", userId);
            await account.updateRecovery(userId, secret, password);
            console.log("[AuthContext] Password reset completed");
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("[AuthContext] Complete password reset error:", errorMsg);
            throw error;
        }
    };

    const logout = async () => {
        if (!isAppwriteConfigured) {
            setUser(null);
            setUserId(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user_id');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_email');
            }
            router.push("/login");
            return;
        }

        try {
            console.log("[AuthContext] Logging out user...");
            await account.deleteSession("current");
            setUser(null);
            setUserId(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user_id');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_email');
            }
            console.log("[AuthContext] Logout successful");
            router.push("/login");
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("[AuthContext] Logout error:", errorMsg);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userId, loading, login, register, requestPasswordReset, completePasswordReset, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
