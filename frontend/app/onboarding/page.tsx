"use client";

import { useState, FormEvent } from "react";
import api from "@/lib/api";
import type { OnboardingStatusResponse } from "@/lib/types";
import { useToast } from "@/components/toast";

export default function OnboardingPage() {
    const [tab, setTab] = useState<"submit" | "status">("submit");
    const [personId, setPersonId] = useState("");
    const [offerId, setOfferId] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifsc, setIfsc] = useState("");
    const [emergencyName, setEmergencyName] = useState("");
    const [emergencyPhone, setEmergencyPhone] = useState("");
    const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
    const [statusPersonId, setStatusPersonId] = useState("");
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/api/v1/onboarding/submit", {
                person_id: Number(personId),
                offer_id: offerId ? Number(offerId) : null,
                form_data: {
                    bank_name: bankName,
                    account_number: accountNumber,
                    ifsc_code: ifsc,
                    emergency_contact_name: emergencyName,
                    emergency_contact_phone: emergencyPhone,
                },
            });
            showToast("Onboarding submitted successfully");
        } catch {
            showToast("Failed to submit onboarding", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatus = async () => {
        if (!statusPersonId) return;
        setLoading(true);
        try {
            const { data } = await api.get<OnboardingStatusResponse>(`/api/v1/onboarding/status/${statusPersonId}`);
            setStatus(data);
        } catch {
            showToast("Failed to fetch status", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="tab-bar">
                <button className={`tab-item ${tab === "submit" ? "active" : ""}`} onClick={() => setTab("submit")}>Submit Onboarding</button>
                <button className={`tab-item ${tab === "status" ? "active" : ""}`} onClick={() => setTab("status")}>Check Status</button>
            </div>

            {tab === "submit" && (
                <div className="glass-card" style={{ padding: "32px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "24px" }}>Onboarding Form</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label className="input-label">Person ID *</label>
                                <input className="input-field" type="number" required value={personId} onChange={(e) => setPersonId(e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">Offer ID</label>
                                <input className="input-field" type="number" value={offerId} onChange={(e) => setOfferId(e.target.value)} placeholder="Optional" />
                            </div>
                        </div>

                        <h4 style={{ fontSize: "15px", fontWeight: 600, marginTop: "24px", marginBottom: "12px", color: "var(--text-secondary)" }}>Bank Details</h4>
                        <div className="form-grid">
                            <div>
                                <label className="input-label">Bank Name</label>
                                <input className="input-field" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" />
                            </div>
                            <div>
                                <label className="input-label">Account Number</label>
                                <input className="input-field" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account number" />
                            </div>
                            <div>
                                <label className="input-label">IFSC Code</label>
                                <input className="input-field" value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="IFSC code" />
                            </div>
                        </div>

                        <h4 style={{ fontSize: "15px", fontWeight: 600, marginTop: "24px", marginBottom: "12px", color: "var(--text-secondary)" }}>Emergency Contact</h4>
                        <div className="form-grid">
                            <div>
                                <label className="input-label">Contact Name</label>
                                <input className="input-field" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder="Full name" />
                            </div>
                            <div>
                                <label className="input-label">Contact Phone</label>
                                <input className="input-field" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="Phone number" />
                            </div>
                        </div>

                        <div style={{ marginTop: "28px" }}>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? "Submitting..." : "Submit Onboarding"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {tab === "status" && (
                <div>
                    <div className="glass-card" style={{ padding: "20px", marginBottom: "24px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                            <div style={{ flex: 1 }}>
                                <label className="input-label">Person ID</label>
                                <input className="input-field" type="number" value={statusPersonId} onChange={(e) => setStatusPersonId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchStatus()} placeholder="Enter person ID" />
                            </div>
                            <button className="btn-primary" onClick={fetchStatus} disabled={loading}>Check Status</button>
                        </div>
                    </div>

                    {status && (
                        <div className="glass-card" style={{ padding: "32px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "24px" }}>Onboarding Progress — Person #{status.person_id}</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {[
                                    { label: "Offer Sent", done: status.offer_sent },
                                    { label: "Offer Accepted", done: status.offer_accepted },
                                    { label: `Documents Uploaded (${status.documents_uploaded})`, done: status.documents_uploaded > 0 },
                                    { label: `Documents Verified (${status.documents_verified})`, done: status.documents_verified > 0 },
                                    { label: "Onboarding Submitted", done: status.onboarding_submitted },
                                ].map((step) => (
                                    <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: "28px", height: "28px", borderRadius: "50%",
                                            background: step.done ? "var(--success)" : "var(--bg-glass)",
                                            border: step.done ? "none" : "1px solid var(--border-color)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "14px", color: "white", flexShrink: 0,
                                        }}>
                                            {step.done ? "✓" : ""}
                                        </div>
                                        <span style={{ fontSize: "14px", color: step.done ? "var(--text-primary)" : "var(--text-muted)" }}>{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
