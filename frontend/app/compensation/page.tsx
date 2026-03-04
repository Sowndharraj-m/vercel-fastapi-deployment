"use client";

import { useState, FormEvent } from "react";
import api from "@/lib/api";
import type {
    CompensationProfileResponse,
    PayoutResponse,
    PayslipResponse,
} from "@/lib/types";
import { useToast } from "@/components/toast";

export default function CompensationPage() {
    const [tab, setTab] = useState<"comp" | "payroll" | "payslips">("comp");
    const { showToast } = useToast();

    // Compensation
    const [compPersonId, setCompPersonId] = useState("");
    const [compProfile, setCompProfile] = useState<CompensationProfileResponse | null>(null);
    const [compLoading, setCompLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [compForm, setCompForm] = useState({ comp_type: "UNPAID", amount: "", currency: "INR", effective_from: "" });

    const fetchComp = async () => {
        if (!compPersonId) return;
        setCompLoading(true);
        try {
            const { data } = await api.get<CompensationProfileResponse>(`/api/v1/compensation/${compPersonId}`);
            setCompProfile(data);
        } catch {
            setCompProfile(null);
            setShowCreate(true);
        } finally {
            setCompLoading(false);
        }
    };

    const handleCreateComp = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.post<CompensationProfileResponse>(`/api/v1/compensation/${compPersonId}`, {
                comp_type: compForm.comp_type,
                amount: compForm.amount ? Number(compForm.amount) : null,
                currency: compForm.currency,
                effective_from: compForm.effective_from || null,
            });
            setCompProfile(data);
            setShowCreate(false);
            showToast("Compensation profile created");
        } catch {
            showToast("Failed to create", "error");
        }
    };

    // Payroll
    const [periodMonth, setPeriodMonth] = useState("");
    const [payouts, setPayouts] = useState<PayoutResponse[]>([]);
    const [payrollLoading, setPayrollLoading] = useState(false);

    const handleRunPayroll = async () => {
        if (!periodMonth) return;
        setPayrollLoading(true);
        try {
            const { data } = await api.post<PayoutResponse[]>("/api/v1/payouts/run-month", { period_month: periodMonth });
            setPayouts(data);
            showToast(`Generated ${data.length} payout(s)`);
        } catch {
            showToast("Failed to run payroll", "error");
        } finally {
            setPayrollLoading(false);
        }
    };

    const handleMarkPaid = async (payoutId: number) => {
        try {
            const { data } = await api.patch<PayoutResponse>(`/api/v1/payouts/${payoutId}/mark-paid`, {});
            setPayouts((prev) => prev.map((p) => (p.id === payoutId ? data : p)));
            showToast("Marked as paid");
        } catch {
            showToast("Failed", "error");
        }
    };

    // Payslips
    const [payslips, setPayslips] = useState<PayslipResponse[]>([]);
    const [payslipLoading, setPayslipLoading] = useState(false);

    const fetchPayslips = async () => {
        setPayslipLoading(true);
        try {
            const { data } = await api.get<PayslipResponse[]>("/api/v1/me/payslips");
            setPayslips(data);
        } catch {
            showToast("Failed to load payslips", "error");
        } finally {
            setPayslipLoading(false);
        }
    };

    const handleDownloadPayslip = async (id: number) => {
        try {
            const { data } = await api.get(`/api/v1/payslips/${id}/download-url`);
            window.open(data.download_url, "_blank");
        } catch {
            showToast("Failed to get download link", "error");
        }
    };

    return (
        <div>
            <div className="tab-bar">
                <button className={`tab-item ${tab === "comp" ? "active" : ""}`} onClick={() => setTab("comp")}>Compensation</button>
                <button className={`tab-item ${tab === "payroll" ? "active" : ""}`} onClick={() => setTab("payroll")}>Run Payroll</button>
                <button className={`tab-item ${tab === "payslips" ? "active" : ""}`} onClick={() => { setTab("payslips"); fetchPayslips(); }}>My Payslips</button>
            </div>

            {tab === "comp" && (
                <div>
                    <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                            <div style={{ flex: 1 }}>
                                <label className="input-label">Person ID</label>
                                <input className="input-field" type="number" value={compPersonId} onChange={(e) => setCompPersonId(e.target.value)} placeholder="Enter person ID" onKeyDown={(e) => e.key === "Enter" && fetchComp()} />
                            </div>
                            <button className="btn-primary" onClick={fetchComp}>Load</button>
                        </div>
                    </div>

                    {compLoading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}><div className="spinner spinner-lg" /></div>
                    ) : compProfile ? (
                        <div className="glass-card" style={{ padding: "32px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Compensation Profile</h3>
                            <div className="form-grid">
                                {[
                                    { label: "Type", value: compProfile.comp_type },
                                    { label: "Amount", value: compProfile.amount != null ? `${compProfile.currency} ${compProfile.amount.toLocaleString()}` : "N/A" },
                                    { label: "Currency", value: compProfile.currency },
                                    { label: "Effective From", value: compProfile.effective_from || "—" },
                                    { label: "Created", value: new Date(compProfile.created_at).toLocaleDateString() },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</div>
                                        <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : showCreate && compPersonId ? (
                        <div className="glass-card" style={{ padding: "32px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Create Compensation Profile</h3>
                            <form onSubmit={handleCreateComp}>
                                <div className="form-grid">
                                    <div>
                                        <label className="input-label">Type *</label>
                                        <select className="input-field" value={compForm.comp_type} onChange={(e) => setCompForm({ ...compForm, comp_type: e.target.value })}>
                                            <option value="UNPAID">Unpaid</option>
                                            <option value="STIPEND_FIXED">Stipend (Fixed)</option>
                                            <option value="SALARY">Salary</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Amount</label>
                                        <input className="input-field" type="number" value={compForm.amount} onChange={(e) => setCompForm({ ...compForm, amount: e.target.value })} placeholder="Monthly amount" />
                                    </div>
                                    <div>
                                        <label className="input-label">Currency</label>
                                        <input className="input-field" value={compForm.currency} onChange={(e) => setCompForm({ ...compForm, currency: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="input-label">Effective From</label>
                                        <input className="input-field" type="date" value={compForm.effective_from} onChange={(e) => setCompForm({ ...compForm, effective_from: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ marginTop: "20px" }}>
                                    <button type="submit" className="btn-primary">Create Profile</button>
                                </div>
                            </form>
                        </div>
                    ) : null}
                </div>
            )}

            {tab === "payroll" && (
                <div>
                    <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                            <div>
                                <label className="input-label">Period (YYYY-MM) *</label>
                                <input className="input-field" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} placeholder="2025-01" pattern="\d{4}-\d{2}" />
                            </div>
                            <button className="btn-primary" onClick={handleRunPayroll} disabled={payrollLoading}>
                                {payrollLoading ? "Running..." : "Run Payroll"}
                            </button>
                        </div>
                    </div>

                    {payouts.length > 0 && (
                        <div className="glass-card" style={{ overflow: "hidden" }}>
                            <table className="data-table">
                                <thead><tr><th>ID</th><th>Person ID</th><th>Period</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {payouts.map((p) => (
                                        <tr key={p.id}>
                                            <td>{p.id}</td>
                                            <td>{p.person_id}</td>
                                            <td>{p.period_month}</td>
                                            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>₹{p.amount.toLocaleString()}</td>
                                            <td>
                                                <span className={`badge ${p.status === "PAID" ? "badge-success" : "badge-warning"}`}>{p.status}</span>
                                            </td>
                                            <td>
                                                {p.status !== "PAID" && (
                                                    <button className="btn-primary btn-sm" onClick={() => handleMarkPaid(p.id)}>Mark Paid</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === "payslips" && (
                <div className="glass-card" style={{ overflow: "hidden" }}>
                    {payslipLoading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><div className="spinner spinner-lg" /></div>
                    ) : payslips.length === 0 ? (
                        <div className="empty-state"><p>No payslips available yet.</p></div>
                    ) : (
                        <table className="data-table">
                            <thead><tr><th>ID</th><th>Payout ID</th><th>Generated</th><th>Actions</th></tr></thead>
                            <tbody>
                                {payslips.map((ps) => (
                                    <tr key={ps.id}>
                                        <td>{ps.id}</td>
                                        <td>{ps.payout_id}</td>
                                        <td>{new Date(ps.generated_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn-secondary btn-sm" onClick={() => handleDownloadPayslip(ps.id)}>Download</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
