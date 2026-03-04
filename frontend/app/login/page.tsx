"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            router.push("/");
        } catch {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "var(--bg-primary)",
                backgroundImage: `
          radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99, 102, 241, 0.12), transparent),
          radial-gradient(ellipse 40% 40% at 20% 100%, rgba(168, 85, 247, 0.06), transparent),
          radial-gradient(ellipse 40% 40% at 80% 100%, rgba(59, 130, 246, 0.06), transparent)
        `,
                padding: "24px",
            }}
        >
            <div className="animate-in" style={{ width: "100%", maxWidth: "420px" }}>
                {/* Logo & Heading */}
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "var(--radius-lg)",
                            background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "26px",
                            color: "white",
                            marginBottom: "20px",
                            boxShadow: "0 8px 28px rgba(99, 102, 241, 0.35)",
                        }}
                    >
                        S
                    </div>
                    <h1 style={{ fontSize: "30px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px", letterSpacing: "-0.03em" }}>
                        Welcome back
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
                        Sign in to your StartupHR account
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass-card" style={{ padding: "36px" }}>
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div
                                style={{
                                    background: "var(--danger-bg)",
                                    border: "1px solid rgba(248, 113, 113, 0.15)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "14px 18px",
                                    color: "var(--danger)",
                                    fontSize: "14px",
                                    marginBottom: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: "22px" }}>
                            <label className="input-label">Email address</label>
                            <input
                                id="login-email"
                                type="email"
                                className="input-field"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: "28px" }}>
                            <label className="input-label">Password</label>
                            <input
                                id="login-password"
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ width: "100%", padding: "14px", fontSize: "15px", marginBottom: "20px" }}
                        >
                            {loading ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                            <Link href="/forgot-password" style={{ color: "var(--accent-hover)", textDecoration: "none", fontWeight: 500 }}>
                                Forgot password?
                            </Link>
                            <Link href="/register" style={{ color: "var(--accent-hover)", textDecoration: "none", fontWeight: 500 }}>
                                Register Admin →
                            </Link>
                        </div>
                    </form>
                </div>

                <p style={{ textAlign: "center", marginTop: "28px", fontSize: "12px", color: "var(--text-muted)" }}>
                    Startup Employee & Intern Management System
                </p>
            </div>
        </div>
    );
}
