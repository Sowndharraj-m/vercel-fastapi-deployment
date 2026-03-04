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
                padding: "24px",
            }}
        >
            <div className="animate-in" style={{ width: "100%", maxWidth: "420px" }}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "var(--radius-lg)",
                            background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "24px",
                            color: "white",
                            margin: "0 auto 16px",
                        }}
                    >
                        S
                    </div>
                    <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                        Welcome back
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
                        Sign in to your StartupHR account
                    </p>
                </div>

                <div className="glass-card" style={{ padding: "32px" }}>
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div
                                style={{
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "12px 16px",
                                    color: "var(--danger)",
                                    fontSize: "14px",
                                    marginBottom: "20px",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: "20px" }}>
                            <label className="input-label">Email</label>
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

                        <div style={{ marginBottom: "24px" }}>
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
                            style={{ width: "100%", marginBottom: "16px" }}
                        >
                            {loading ? (
                                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                    <span className="spinner" /> Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                            <Link href="/forgot-password" style={{ color: "var(--accent)", textDecoration: "none" }}>
                                Forgot password?
                            </Link>
                            <Link href="/register" style={{ color: "var(--accent)", textDecoration: "none" }}>
                                Register Admin
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
