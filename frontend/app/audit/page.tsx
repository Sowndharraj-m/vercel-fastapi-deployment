"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { AuditLogListResponse, AuditLogResponse } from "@/lib/types";
import { useToast } from "@/components/toast";

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLogResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ entity_type: "", action: "", actor_user_id: "" });
    const [skip, setSkip] = useState(0);
    const { showToast } = useToast();

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.entity_type) params.set("entity_type", filters.entity_type);
            if (filters.action) params.set("action", filters.action);
            if (filters.actor_user_id) params.set("actor_user_id", filters.actor_user_id);
            params.set("skip", skip.toString());
            params.set("limit", "50");
            const { data } = await api.get<AuditLogListResponse>(`/api/v1/audit?${params}`);
            setLogs(data.items);
            setTotal(data.total);
        } catch {
            showToast("Failed to load audit logs", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, [skip]);

    return (
        <div>
            <div className="glass-card" style={{ padding: "20px", marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 160px" }}>
                        <label className="input-label">Entity Type</label>
                        <input className="input-field" value={filters.entity_type} onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })} placeholder="e.g. Person" />
                    </div>
                    <div style={{ flex: "1 1 160px" }}>
                        <label className="input-label">Action</label>
                        <input className="input-field" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} placeholder="e.g. CREATE" />
                    </div>
                    <div style={{ flex: "1 1 120px" }}>
                        <label className="input-label">Actor User ID</label>
                        <input className="input-field" type="number" value={filters.actor_user_id} onChange={(e) => setFilters({ ...filters, actor_user_id: e.target.value })} />
                    </div>
                    <button className="btn-primary" onClick={() => { setSkip(0); fetchLogs(); }}>Search</button>
                </div>
            </div>

            <div className="glass-card" style={{ overflow: "hidden" }}>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><div className="spinner spinner-lg" /></div>
                ) : logs.length === 0 ? (
                    <div className="empty-state"><p>No audit logs found.</p></div>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Timestamp</th>
                                        <th>Actor</th>
                                        <th>Action</th>
                                        <th>Entity</th>
                                        <th>Entity ID</th>
                                        <th>IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id}>
                                            <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{log.id}</td>
                                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                                            <td>{log.actor_user_id ?? "System"}</td>
                                            <td>
                                                <span className={`badge ${log.action.includes("CREATE") ? "badge-success" :
                                                        log.action.includes("DELETE") ? "badge-danger" :
                                                            log.action.includes("UPDATE") ? "badge-info" : "badge-neutral"
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{log.entity_type}</td>
                                            <td>{log.entity_id}</td>
                                            <td style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-muted)" }}>{log.ip_address || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)" }}>
                            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Showing {logs.length} of {total}</span>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button className="btn-secondary btn-sm" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - 50))}>Previous</button>
                                <button className="btn-secondary btn-sm" disabled={skip + 50 >= total} onClick={() => setSkip(skip + 50)}>Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
