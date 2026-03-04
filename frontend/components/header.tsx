"use client";

import { useAuth } from "@/context/auth-context";

export default function Header({ title }: { title?: string }) {
    const { user, logout } = useAuth();

    return (
        <header className="app-header">
            <h1 className="app-header-title">{title || "Dashboard"}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                {user && (
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ textAlign: "right", lineHeight: 1.3 }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                                {user.email}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {user.role}
                            </div>
                        </div>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "var(--radius-md)",
                                background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "15px",
                                color: "white",
                                boxShadow: "0 2px 10px rgba(99, 102, 241, 0.25)",
                                flexShrink: 0,
                            }}
                        >
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ width: "1px", height: "28px", background: "var(--border-color)" }} />
                        <button
                            onClick={logout}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--bg-glass)",
                                border: "1px solid var(--border-color)",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: 500,
                                transition: "all 150ms ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = "var(--danger)";
                                e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)";
                                e.currentTarget.style.background = "var(--danger-bg)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = "var(--text-muted)";
                                e.currentTarget.style.borderColor = "var(--border-color)";
                                e.currentTarget.style.background = "var(--bg-glass)";
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
