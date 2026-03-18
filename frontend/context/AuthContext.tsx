"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { account } from "@/lib/appwrite";
import apiClient from "@/lib/api";
import { ID, Models } from "appwrite";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    userId: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
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
        try {
            const currentUser = await account.get();
            setUser(currentUser);
            setUserId(currentUser.$id);
            if (typeof window !== 'undefined') {
                localStorage.setItem('user_id', currentUser.$id);
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
                console.warn("Could not generate JWT:", jwtError);
            }
        } catch (error) {
            setUser(null);
            setUserId(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            // Logout any existing session before creating a new one
            try {
                await account.deleteSession("current");
            } catch {
                // No active session to delete
            }
            await account.createEmailPasswordSession(email, password);
            const currentUser = await account.get();
            setUser(currentUser);
            setUserId(currentUser.$id);
            if (typeof window !== 'undefined') {
                localStorage.setItem('user_id', currentUser.$id);
            }
            // Initialize API client with user info
            apiClient.setUserId(currentUser.$id);
            
            // Generate JWT
            const session = await account.createJWT();
            apiClient.setToken(session.jwt);
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', session.jwt);
            }
            
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const register = async (email: string, password: string, name: string) => {
        try {
            await account.create(ID.unique(), email, password, name);
            await login(email, password);
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession("current");
            setUser(null);
            setUserId(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user_id');
                localStorage.removeItem('auth_token');
            }
            router.push("/login");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userId, loading, login, register, logout }}>
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
