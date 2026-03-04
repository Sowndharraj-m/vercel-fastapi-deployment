"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";
import type {
    OfferTemplateResponse,
    OfferLetterResponse,
    OfferTemplateCreate,
    OfferLetterGenerate,
} from "@/lib/types";
import Modal from "@/components/modal";
import { useToast } from "@/components/toast";

export default function OffersPage() {
    const [tab, setTab] = useState<"offers" | "templates" | "my">("offers");
    const [templates, setTemplates] = useState<OfferTemplateResponse[]>([]);
    const [myOffers, setMyOffers] = useState<OfferLetterResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateTemplate, setShowCreateTemplate] = useState(false);
    const [showGenerate, setShowGenerate] = useState(false);
    const [templateForm, setTemplateForm] = useState<OfferTemplateCreate>({ name: "", content: "" });
    const [genForm, setGenForm] = useState<OfferLetterGenerate>({ person_id: 0, template_id: 0 });
    const { showToast } = useToast();

    const fetchTemplates = async () => {
        try {
            const { data } = await api.get<OfferTemplateResponse[]>("/api/v1/offers/templates");
            setTemplates(data);
        } catch {/* ignore */ }
    };

    const fetchMyOffers = async () => {
        try {
            const { data } = await api.get<OfferLetterResponse[]>("/api/v1/offers/me/offers");
            setMyOffers(data);
        } catch {/* ignore */ }
    };

    useEffect(() => {
        Promise.all([fetchTemplates(), fetchMyOffers()]).finally(() => setLoading(false));
    }, []);

    const handleCreateTemplate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/api/v1/offers/templates", templateForm);
            showToast("Template created");
            setShowCreateTemplate(false);
            setTemplateForm({ name: "", content: "" });
            fetchTemplates();
        } catch { showToast("Failed", "error"); }
    };

    const handleGenerate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/api/v1/offers", genForm);
            showToast("Offer generated");
            setShowGenerate(false);
            fetchMyOffers();
        } catch { showToast("Failed to generate offer", "error"); }
    };

    const handleSend = async (id: number) => {
        try {
            await api.post(`/api/v1/offers/${id}/send`);
            showToast("Offer sent");
            fetchMyOffers();
        } catch { showToast("Failed", "error"); }
    };

    const handleAccept = async (id: number) => {
        try {
            await api.post(`/api/v1/offers/${id}/accept`, { confirmation: true });
            showToast("Offer accepted");
            fetchMyOffers();
        } catch { showToast("Failed", "error"); }
    };

    const handleDecline = async (id: number) => {
        try {
            await api.post(`/api/v1/offers/${id}/decline`, {});
            showToast("Offer declined");
            fetchMyOffers();
        } catch { showToast("Failed", "error"); }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case "DRAFT": return "badge-neutral";
            case "SENT": return "badge-info";
            case "VIEWED": return "badge-warning";
            case "ACCEPTED": return "badge-success";
            case "DECLINED": return "badge-danger";
            default: return "badge-neutral";
        }
    };

    if (loading) {
        return <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><div className="spinner spinner-lg" /></div>;
    }

    return (
        <div>
            <div className="tab-bar">
                <button className={`tab-item ${tab === "templates" ? "active" : ""}`} onClick={() => setTab("templates")}>Templates</button>
                <button className={`tab-item ${tab === "offers" ? "active" : ""}`} onClick={() => setTab("offers")}>Generate Offer</button>
                <button className={`tab-item ${tab === "my" ? "active" : ""}`} onClick={() => setTab("my")}>My Offers</button>
            </div>

            {tab === "templates" && (
                <div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                        <button className="btn-primary" onClick={() => setShowCreateTemplate(true)}>+ New Template</button>
                    </div>
                    <div className="glass-card" style={{ overflow: "hidden" }}>
                        {templates.length === 0 ? (
                            <div className="empty-state"><p>No templates yet. Create one to get started.</p></div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>Name</th><th>Version</th><th>Placeholders</th><th>Created</th></tr></thead>
                                <tbody>
                                    {templates.map((t) => (
                                        <tr key={t.id}>
                                            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.name}</td>
                                            <td>v{t.version}</td>
                                            <td>{t.placeholders_schema?.join(", ") || "—"}</td>
                                            <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {tab === "offers" && (
                <div className="glass-card" style={{ padding: "32px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Generate Offer Letter</h3>
                    <form onSubmit={handleGenerate}>
                        <div className="form-grid">
                            <div>
                                <label className="input-label">Person ID *</label>
                                <input className="input-field" type="number" required value={genForm.person_id || ""} onChange={(e) => setGenForm({ ...genForm, person_id: Number(e.target.value) })} placeholder="Person ID" />
                            </div>
                            <div>
                                <label className="input-label">Template *</label>
                                <select className="input-field" required value={genForm.template_id || ""} onChange={(e) => setGenForm({ ...genForm, template_id: Number(e.target.value) })}>
                                    <option value="">Select template</option>
                                    {templates.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: "20px" }}>
                            <button type="submit" className="btn-primary">Generate Offer</button>
                        </div>
                    </form>
                </div>
            )}

            {tab === "my" && (
                <div className="glass-card" style={{ overflow: "hidden" }}>
                    {myOffers.length === 0 ? (
                        <div className="empty-state"><p>No offers found.</p></div>
                    ) : (
                        <table className="data-table">
                            <thead><tr><th>ID</th><th>Person ID</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                            <tbody>
                                {myOffers.map((o) => (
                                    <tr key={o.id}>
                                        <td>{o.id}</td>
                                        <td>{o.person_id}</td>
                                        <td><span className={`badge ${getStatusBadge(o.status)}`}>{o.status}</span></td>
                                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                                        <td style={{ display: "flex", gap: "4px" }}>
                                            {o.status === "DRAFT" && <button className="btn-secondary btn-sm" onClick={() => handleSend(o.id)}>Send</button>}
                                            {(o.status === "SENT" || o.status === "VIEWED") && (
                                                <>
                                                    <button className="btn-primary btn-sm" onClick={() => handleAccept(o.id)}>Accept</button>
                                                    <button className="btn-danger btn-sm" onClick={() => handleDecline(o.id)}>Decline</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Create Template Modal */}
            <Modal open={showCreateTemplate} onClose={() => setShowCreateTemplate(false)} title="Create Template">
                <form onSubmit={handleCreateTemplate}>
                    <div style={{ marginBottom: "16px" }}>
                        <label className="input-label">Template Name *</label>
                        <input className="input-field" required value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g. Intern Offer Letter" />
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                        <label className="input-label">Content (HTML/Markdown with {`{{PLACEHOLDERS}}`}) *</label>
                        <textarea className="input-field" required rows={8} value={templateForm.content} onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })} placeholder="Dear {{NAME}}, ..." style={{ resize: "vertical" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowCreateTemplate(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">Create</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
