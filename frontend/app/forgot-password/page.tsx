"use client";

import { useState, FormEvent } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<"forgot" | "reset">("forgot");
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleForgot = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await api.post("/api/v1/auth/forgot-password", { email });
            setMessage("If that email exists, a reset link has been sent.");
            setStep("reset");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await api.post("/api/v1/auth/reset-password", { token, new_password: newPassword });
            setMessage("Password reset successfully! You can now log in.");
        } catch {
            setError("Invalid or expired token.");
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
                    <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                        {step === "forgot" ? "Forgot Password" : "Reset Password"}
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
                        {step === "forgot" ? "Enter your email to receive a reset link" : "Enter the token and your new password"}
                    </p>
                </div>

                <div className="glass-card" style={{ padding: "32px" }}>
                    {message && !error && (
                        <div
                            style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                                borderRadius: "var(--radius-md)",
                                padding: "12px 16px",
                                color: "var(--success)",
                                fontSize: "14px",
                                marginBottom: "20px",
                            }}
                        >
                            {message}
                        </div>
                    )}
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

                    {step === "forgot" ? (
                        <form onSubmit={handleForgot}>
                            <div style={{ marginBottom: "24px" }}>
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginBottom: "16px" }}>
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset}>
                            <div style={{ marginBottom: "20px" }}>
                                <label className="input-label">Reset Token</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Paste your reset token"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: "24px" }}>
                                <label className="input-label">New Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Min 8 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginBottom: "16px" }}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>
                    )}

                    <div style={{ textAlign: "center", fontSize: "13px" }}>
                        <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
