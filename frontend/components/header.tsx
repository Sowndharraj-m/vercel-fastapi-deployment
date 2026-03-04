"use client";

import { useAuth } from "@/context/auth-context";

export default function Header({ title }: { title?: string }) {
    const { user, logout } = useAuth();

    return (
        <header className="app-header">
            <h1 className="app-header-title">{title || "Dashboard"}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {user && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                                {user.email}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                {user.role}
                            </div>
                        </div>
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "var(--radius-md)",
                                background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "14px",
                                color: "white",
                            }}
                        >
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <button onClick={logout} className="btn-secondary btn-sm" style={{ marginLeft: "4px" }}>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
