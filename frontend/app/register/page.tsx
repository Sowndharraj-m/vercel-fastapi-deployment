"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const { registerAdmin } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await registerAdmin(email, password);
            setSuccess(true);
            setTimeout(() => router.push("/login"), 2000);
        } catch {
            setError("Registration failed. An admin may already exist.");
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
                        Bootstrap Admin
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
                        Create the first admin account
                    </p>
                </div>

                <div className="glass-card" style={{ padding: "32px" }}>
                    {success ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "24px 0",
                                color: "var(--success)",
                                fontSize: "15px",
                            }}
                        >
                            ✓ Admin created! Redirecting to login...
                        </div>
                    ) : (
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
                                    type="email"
                                    className="input-field"
                                    placeholder="admin@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label className="input-label">Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Min 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div style={{ marginBottom: "24px" }}>
                                <label className="input-label">Confirm Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Re-enter password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                                style={{ width: "100%", marginBottom: "16px" }}
                            >
                                {loading ? "Creating..." : "Create Admin Account"}
                            </button>

                            <div style={{ textAlign: "center", fontSize: "13px" }}>
                                <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>
                                    ← Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
