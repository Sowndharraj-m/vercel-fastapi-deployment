"use client";

import { useAuth } from "@/context/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

const PAGE_TITLES: Record<string, string> = {
    "/": "Dashboard",
    "/people": "People Management",
    "/offers": "Offer Letters",
    "/documents": "Documents",
    "/onboarding": "Onboarding",
    "/attendance": "Attendance",
    "/compensation": "Compensation & Payroll",
    "/audit": "Audit Logs",
    "/profile": "My Profile",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const isAuthPage = AUTH_PAGES.includes(pathname);

    useEffect(() => {
        if (!loading && !user && !isAuthPage) {
            router.push("/login");
        }
    }, [user, loading, isAuthPage, router]);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    if (isAuthPage) {
        return <>{children}</>;
    }

    if (!user) return null;

    const title = PAGE_TITLES[pathname] || Object.entries(PAGE_TITLES).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] || "Dashboard";

    return (
        <>
            <Sidebar />
            <div className="page-container">
                <Header title={title} />
                <main className="page-content animate-in">{children}</main>
            </div>
        </>
    );
}
