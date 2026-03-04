"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";
import type { DocumentListResponse } from "@/lib/types";
import { useToast } from "@/components/toast";
import Modal from "@/components/modal";

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentListResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [personId, setPersonId] = useState("");
    const [showUpload, setShowUpload] = useState(false);
    const [uploadForm, setUploadForm] = useState({ person_id: "", doc_type: "AADHAAR", file: null as File | null });
    const { showToast } = useToast();

    const fetchDocs = async () => {
        if (!personId) return;
        setLoading(true);
        try {
            const { data } = await api.get<DocumentListResponse[]>(`/api/v1/documents?person_id=${personId}`);
            setDocuments(data);
        } catch {
            showToast("Failed to load documents", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!uploadForm.file) return;
        const fd = new FormData();
        fd.append("person_id", uploadForm.person_id);
        fd.append("doc_type", uploadForm.doc_type);
        fd.append("file", uploadForm.file);
        try {
            await api.post("/api/v1/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            showToast("Document uploaded");
            setShowUpload(false);
            if (personId === uploadForm.person_id) fetchDocs();
        } catch {
            showToast("Upload failed", "error");
        }
    };

    const handleVerify = async (docId: number) => {
        try {
            await api.post(`/api/v1/documents/${docId}/verify`, { notes: "Verified" });
            showToast("Document verified");
            fetchDocs();
        } catch { showToast("Failed", "error"); }
    };

    const handleReject = async (docId: number) => {
        const reason = prompt("Rejection reason:");
        if (!reason) return;
        try {
            await api.post(`/api/v1/documents/${docId}/reject`, { notes: reason });
            showToast("Document rejected");
            fetchDocs();
        } catch { showToast("Failed", "error"); }
    };

    const handleDownload = async (docId: number) => {
        try {
            const { data } = await api.get(`/api/v1/documents/${docId}/download-url`);
            window.open(data.download_url, "_blank");
        } catch { showToast("Failed to get download URL", "error"); }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case "PENDING": return "badge-warning";
            case "VERIFIED": return "badge-success";
            case "REJECTED": return "badge-danger";
            default: return "badge-neutral";
        }
    };

    return (
        <div>
            <div className="glass-card" style={{ padding: "20px", marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 200px" }}>
                        <label className="input-label">Person ID</label>
                        <input className="input-field" type="number" placeholder="Enter person ID to view documents" value={personId} onChange={(e) => setPersonId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchDocs()} />
                    </div>
                    <button className="btn-secondary" onClick={fetchDocs}>Load Documents</button>
                    <button className="btn-primary" onClick={() => setShowUpload(true)}>Upload Document</button>
                </div>
            </div>

            <div className="glass-card" style={{ overflow: "hidden" }}>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><div className="spinner spinner-lg" /></div>
                ) : documents.length === 0 ? (
                    <div className="empty-state"><p>No documents found. Enter a person ID and click Load.</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr><th>Type</th><th>Filename</th><th>Status</th><th>Uploaded</th><th>Verified</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {documents.map((d) => (
                                <tr key={d.id}>
                                    <td><span className="badge badge-accent">{d.doc_type}</span></td>
                                    <td style={{ color: "var(--text-primary)" }}>{d.original_filename || "—"}</td>
                                    <td><span className={`badge ${getStatusBadge(d.status)}`}>{d.status}</span></td>
                                    <td>{new Date(d.uploaded_at).toLocaleDateString()}</td>
                                    <td>{d.verified_at ? new Date(d.verified_at).toLocaleDateString() : "—"}</td>
                                    <td style={{ display: "flex", gap: "4px" }}>
                                        <button className="btn-secondary btn-sm" onClick={() => handleDownload(d.id)}>Download</button>
                                        {d.status === "PENDING" && (
                                            <>
                                                <button className="btn-primary btn-sm" onClick={() => handleVerify(d.id)}>Verify</button>
                                                <button className="btn-danger btn-sm" onClick={() => handleReject(d.id)}>Reject</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {documents.some((d) => d.rejection_notes) && (
                <div className="glass-card" style={{ padding: "20px", marginTop: "16px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "var(--danger)" }}>Rejection Notes</h4>
                    {documents.filter((d) => d.rejection_notes).map((d) => (
                        <div key={d.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color)", fontSize: "13px" }}>
                            <strong>{d.doc_type}:</strong> <span style={{ color: "var(--text-secondary)" }}>{d.rejection_notes}</span>
                        </div>
                    ))}
                </div>
            )}

            <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Document">
                <form onSubmit={handleUpload}>
                    <div className="form-grid">
                        <div>
                            <label className="input-label">Person ID *</label>
                            <input className="input-field" type="number" required value={uploadForm.person_id} onChange={(e) => setUploadForm({ ...uploadForm, person_id: e.target.value })} />
                        </div>
                        <div>
                            <label className="input-label">Document Type *</label>
                            <select className="input-field" value={uploadForm.doc_type} onChange={(e) => setUploadForm({ ...uploadForm, doc_type: e.target.value })}>
                                <option value="AADHAAR">Aadhaar</option>
                                <option value="PAN">PAN</option>
                                <option value="COLLEGE_ID">College ID</option>
                                <option value="PHOTO">Photo</option>
                                <option value="RESUME">Resume</option>
                                <option value="ADDRESS_PROOF">Address Proof</option>
                            </select>
                        </div>
                        <div className="form-full">
                            <label className="input-label">File *</label>
                            <input className="input-field" type="file" required onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} style={{ padding: "8px" }} />
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">Upload</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
