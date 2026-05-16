"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextType = {
    theme: ThemeMode;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = "taskflow-theme";

function getSystemTheme() {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        const initialTheme: ThemeMode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
        setThemeState(initialTheme);
    }, []);

    useEffect(() => {
        const resolved = theme === "system" ? getSystemTheme() : theme;
        setResolvedTheme(resolved);
        applyTheme(theme);

        if (theme === "system") {
            const media = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => applyTheme("system");
            media.addEventListener("change", handler);
            return () => media.removeEventListener("change", handler);
        }
    }, [theme]);

    const setTheme = (nextTheme: ThemeMode) => {
        setThemeState(nextTheme);
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
    };

    const value = useMemo(
        () => ({
            theme,
            resolvedTheme,
            setTheme,
        }),
        [theme, resolvedTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
