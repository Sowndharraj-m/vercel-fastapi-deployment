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
                backgroundImage: `
          radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99, 102, 241, 0.12), transparent),
          radial-gradient(ellipse 40% 40% at 80% 100%, rgba(168, 85, 247, 0.06), transparent)
        `,
                padding: "24px",
            }}
        >
            <div className="animate-in" style={{ width: "100%", maxWidth: "420px" }}>
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
                        Bootstrap Admin
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
                        Create the first admin account for your organization
                    </p>
                </div>

                <div className="glass-card" style={{ padding: "36px" }}>
                    {success ? (
                        <div style={{ textAlign: "center", padding: "32px 0" }}>
                            <div style={{
                                width: "56px", height: "56px", borderRadius: "50%",
                                background: "var(--success-bg)", display: "inline-flex",
                                alignItems: "center", justifyContent: "center", marginBottom: "16px",
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" style={{ width: 28, height: 28 }}>
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <p style={{ color: "var(--success)", fontSize: "16px", fontWeight: 600 }}>Admin created successfully!</p>
                            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "8px" }}>Redirecting to login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div style={{
                                    background: "var(--danger-bg)", border: "1px solid rgba(248, 113, 113, 0.15)",
                                    borderRadius: "var(--radius-md)", padding: "14px 18px", color: "var(--danger)",
                                    fontSize: "14px", marginBottom: "24px",
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ marginBottom: "22px" }}>
                                <label className="input-label">Email address</label>
                                <input type="email" className="input-field" placeholder="admin@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>

                            <div style={{ marginBottom: "22px" }}>
                                <label className="input-label">Password</label>
                                <input type="password" className="input-field" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                            </div>

                            <div style={{ marginBottom: "28px" }}>
                                <label className="input-label">Confirm Password</label>
                                <input type="password" className="input-field" placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", fontSize: "15px", marginBottom: "20px" }}>
                                {loading ? "Creating..." : "Create Admin Account"}
                            </button>

                            <div style={{ textAlign: "center", fontSize: "13px" }}>
                                <Link href="/login" style={{ color: "var(--accent-hover)", textDecoration: "none", fontWeight: 500 }}>
                                    ← Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                <p style={{ textAlign: "center", marginTop: "28px", fontSize: "12px", color: "var(--text-muted)" }}>
                    Startup Employee & Intern Management System
                </p>
            </div>
        </div>
    );
}
