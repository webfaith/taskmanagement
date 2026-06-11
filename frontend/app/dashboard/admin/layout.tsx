"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else {
                const isAdmin = user.email === 'digitalverify23@gmail.com' || user.email === 'peterkehindeademola@gmail.com';
                if (!isAdmin) {
                    router.push("/dashboard");
                }
            }
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const isAdmin = user.email === 'digitalverify23@gmail.com' || user.email === 'peterkehindeademola@gmail.com';
    if (!isAdmin) {
        return null;
    }

    return <>{children}</>;
}
