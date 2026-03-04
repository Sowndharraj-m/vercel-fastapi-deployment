"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";
import type { AttendanceResponse, AttendanceSummary } from "@/lib/types";
import { useToast } from "@/components/toast";

export default function AttendancePage() {
    const [tab, setTab] = useState<"checkin" | "mark" | "my" | "admin">("checkin");
    const [myRecords, setMyRecords] = useState<AttendanceResponse[]>([]);
    const [adminRecords, setAdminRecords] = useState<AttendanceResponse[]>([]);
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState("");
    const [markDate, setMarkDate] = useState("");
    const [markStatus, setMarkStatus] = useState("PRESENT");
    const [markNotes, setMarkNotes] = useState("");
    const [myFrom, setMyFrom] = useState("");
    const [myTo, setMyTo] = useState("");
    const [adminPersonId, setAdminPersonId] = useState("");
    const [adminFrom, setAdminFrom] = useState("");
    const [adminTo, setAdminTo] = useState("");
    const { showToast } = useToast();

    const handleCheckIn = async () => {
        try {
            await api.post("/api/v1/attendance/check-in", { notes: notes || null });
            showToast("Checked in successfully");
            setNotes("");
        } catch { showToast("Check-in failed. Already checked in?", "error"); }
    };

    const handleCheckOut = async () => {
        try {
            await api.post("/api/v1/attendance/check-out", { notes: notes || null });
            showToast("Checked out successfully");
            setNotes("");
        } catch { showToast("Check-out failed", "error"); }
    };

    const handleMark = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/api/v1/attendance/mark", {
                date: markDate,
                status: markStatus,
                notes: markNotes || null,
            });
            showToast("Attendance marked");
            setMarkDate(""); setMarkNotes("");
        } catch { showToast("Failed to mark attendance", "error"); }
    };

    const fetchMyAttendance = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (myFrom) params.set("from", myFrom);
            if (myTo) params.set("to", myTo);
            const { data } = await api.get<AttendanceResponse[]>(`/api/v1/attendance/me?${params}`);
            setMyRecords(data);
        } catch { showToast("Failed to load attendance", "error"); }
        finally { setLoading(false); }
    };

    const fetchAdminAttendance = async () => {
        if (!adminPersonId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ person_id: adminPersonId });
            if (adminFrom) params.set("from", adminFrom);
            if (adminTo) params.set("to", adminTo);
            const { data } = await api.get<AttendanceResponse[]>(`/api/v1/attendance?${params}`);
            setAdminRecords(data);

            if (adminFrom && adminTo) {
                const { data: s } = await api.get<AttendanceSummary>(
                    `/api/v1/attendance/summary?person_id=${adminPersonId}&from=${adminFrom}&to=${adminTo}`
                );
                setSummary(s);
            }
        } catch { showToast("Failed to load", "error"); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (tab === "my") fetchMyAttendance();
    }, [tab]);

    const getStatusBadge = (s: string) => {
        switch (s) {
            case "PRESENT": return "badge-success";
            case "ABSENT": return "badge-danger";
            case "HALF_DAY": return "badge-warning";
            case "LEAVE": return "badge-info";
            case "HOLIDAY": return "badge-accent";
            default: return "badge-neutral";
        }
    };

    return (
        <div>
            <div className="tab-bar">
                <button className={`tab-item ${tab === "checkin" ? "active" : ""}`} onClick={() => setTab("checkin")}>Check In / Out</button>
                <button className={`tab-item ${tab === "mark" ? "active" : ""}`} onClick={() => setTab("mark")}>Mark Attendance</button>
                <button className={`tab-item ${tab === "my" ? "active" : ""}`} onClick={() => setTab("my")}>My Records</button>
                <button className={`tab-item ${tab === "admin" ? "active" : ""}`} onClick={() => setTab("admin")}>Admin View</button>
            </div>

            {tab === "checkin" && (
                <div className="glass-card" style={{ padding: "32px", maxWidth: "500px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Quick Check In / Out</h3>
                    <div style={{ marginBottom: "20px" }}>
                        <label className="input-label">Notes (optional)</label>
                        <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Working from home, etc." />
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button className="btn-primary" onClick={handleCheckIn} style={{ flex: 1 }}>
                            ☀️ Check In
                        </button>
                        <button className="btn-secondary" onClick={handleCheckOut} style={{ flex: 1 }}>
                            🌙 Check Out
                        </button>
                    </div>
                </div>
            )}

            {tab === "mark" && (
                <div className="glass-card" style={{ padding: "32px", maxWidth: "500px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Mark Attendance</h3>
                    <form onSubmit={handleMark}>
                        <div className="form-grid">
                            <div>
                                <label className="input-label">Date *</label>
                                <input className="input-field" type="date" required value={markDate} onChange={(e) => setMarkDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">Status *</label>
                                <select className="input-field" value={markStatus} onChange={(e) => setMarkStatus(e.target.value)}>
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                    <option value="HALF_DAY">Half Day</option>
                                    <option value="LEAVE">Leave</option>
                                    <option value="HOLIDAY">Holiday</option>
                                </select>
                            </div>
                            <div className="form-full">
                                <label className="input-label">Notes</label>
                                <input className="input-field" value={markNotes} onChange={(e) => setMarkNotes(e.target.value)} placeholder="Optional notes" />
                            </div>
                        </div>
                        <div style={{ marginTop: "20px" }}>
                            <button type="submit" className="btn-primary">Mark Attendance</button>
                        </div>
                    </form>
                </div>
            )}

            {tab === "my" && (
                <div>
                    <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                            <div>
                                <label className="input-label">From</label>
                                <input className="input-field" type="date" value={myFrom} onChange={(e) => setMyFrom(e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">To</label>
                                <input className="input-field" type="date" value={myTo} onChange={(e) => setMyTo(e.target.value)} />
                            </div>
                            <button className="btn-secondary" onClick={fetchMyAttendance}>Filter</button>
                        </div>
                    </div>
                    <div className="glass-card" style={{ overflow: "hidden" }}>
                        {loading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><div className="spinner spinner-lg" /></div>
                        ) : myRecords.length === 0 ? (
                            <div className="empty-state"><p>No attendance records found.</p></div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Notes</th></tr></thead>
                                <tbody>
                                    {myRecords.map((r) => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.date}</td>
                                            <td><span className={`badge ${getStatusBadge(r.status)}`}>{r.status}</span></td>
                                            <td>{r.check_in ? new Date(r.check_in).toLocaleTimeString() : "—"}</td>
                                            <td>{r.check_out ? new Date(r.check_out).toLocaleTimeString() : "—"}</td>
                                            <td>{r.notes || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {tab === "admin" && (
                <div>
                    <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                            <div>
                                <label className="input-label">Person ID *</label>
                                <input className="input-field" type="number" value={adminPersonId} onChange={(e) => setAdminPersonId(e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">From</label>
                                <input className="input-field" type="date" value={adminFrom} onChange={(e) => setAdminFrom(e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">To</label>
                                <input className="input-field" type="date" value={adminTo} onChange={(e) => setAdminTo(e.target.value)} />
                            </div>
                            <button className="btn-primary" onClick={fetchAdminAttendance}>Load</button>
                        </div>
                    </div>

                    {summary && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                            {[
                                { label: "Present", value: summary.total_present, color: "var(--success)" },
                                { label: "Absent", value: summary.total_absent, color: "var(--danger)" },
                                { label: "Half Day", value: summary.total_half_day, color: "var(--warning)" },
                                { label: "Leave", value: summary.total_leave, color: "var(--info)" },
                                { label: "Holiday", value: summary.total_holiday, color: "var(--accent)" },
                            ].map((s) => (
                                <div key={s.label} className="glass-card-sm" style={{ padding: "16px", textAlign: "center" }}>
                                    <div style={{ fontSize: "24px", fontWeight: 700, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="glass-card" style={{ overflow: "hidden" }}>
                        {loading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><div className="spinner spinner-lg" /></div>
                        ) : adminRecords.length === 0 ? (
                            <div className="empty-state"><p>Enter a person ID and click Load.</p></div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Notes</th></tr></thead>
                                <tbody>
                                    {adminRecords.map((r) => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.date}</td>
                                            <td><span className={`badge ${getStatusBadge(r.status)}`}>{r.status}</span></td>
                                            <td>{r.check_in ? new Date(r.check_in).toLocaleTimeString() : "—"}</td>
                                            <td>{r.check_out ? new Date(r.check_out).toLocaleTimeString() : "—"}</td>
                                            <td>{r.notes || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
