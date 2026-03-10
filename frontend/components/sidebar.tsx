"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";

interface NavItem {
    label: string;
    href: string;
    roles: string[]; // which roles can see this item
    icon: React.ReactNode;
}

interface NavSection {
    section: string;
    items: NavItem[];
}

const NAV_ITEMS: NavSection[] = [
    {
        section: "Overview",
        items: [
            {
                label: "Dashboard",
                href: "/",
                roles: ["ADMIN", "HR", "EMPLOYEE"],
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                ),
            },
        ],
    },
    {
        section: "Management",
        items: [
            {
                label: "People",
                href: "/people",
                roles: ["ADMIN", "HR"],
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                ),
            },
            {
                label: "Offer Letters",
                href: "/offers",
                roles: ["ADMIN", "HR"],
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                ),
            },
            {
                label: "Documents",
                href: "/documents",
                roles: ["ADMIN", "HR", "EMPLOYEE"],
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                ),
            },
            {
                label: "Onboarding",
                href: "/onboarding",
                roles: ["ADMIN", "HR", "EMPLOYEE"],
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                ),
            },
        ],
    },
    {
        section: "Operations",
        items: [
            {
                label: "Attendance",
                href: "/attendance",
                roles: ["ADMIN", "HR", "EMPLOYEE"],
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                ),
            },
            {
                label: "Compensation",
                href: "/compensation",
                roles: ["ADMIN"],
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                ),
            },
            {
                label: "Audit Logs",
                href: "/audit",
                roles: ["ADMIN"],
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                ),
            },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const userRole = user?.role || "EMPLOYEE";

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">S</div>
                <span className="sidebar-logo-text">StartupHR</span>
            </div>
            <nav className="sidebar-nav">
                {NAV_ITEMS.map((section) => {
                    const visibleItems = section.items.filter((item) => item.roles.includes(userRole));
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={section.section}>
                            <div className="sidebar-section-label">{section.section}</div>
                            {visibleItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link ${pathname === item.href ||
                                        (item.href !== "/" && pathname.startsWith(item.href))
                                        ? "active"
                                        : ""
                                        }`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    );
                })}
            </nav>
            <div style={{ padding: "16px 14px", borderTop: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 14px", marginBottom: "4px" }}>
                    <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px", fontWeight: 700, color: "white",
                    }}>
                        {user?.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {user?.email || "User"}
                        </div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent-hover)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {userRole}
                        </div>
                    </div>
                </div>
                <Link href="/profile" className={`sidebar-link ${pathname === "/profile" ? "active" : ""}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>My Profile</span>
                </Link>
            </div>
        </aside>
    );
}
