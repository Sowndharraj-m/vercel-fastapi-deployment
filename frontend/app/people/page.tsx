"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";
import type { PersonResponse, PersonListResponse, PersonCreate } from "@/lib/types";
import Modal from "@/components/modal";
import { useToast } from "@/components/toast";
import Link from "next/link";

export default function PeoplePage() {
    const [people, setPeople] = useState<PersonResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [filters, setFilters] = useState({ person_type: "", status: "", department: "", search: "" });
    const [skip, setSkip] = useState(0);
    const { showToast } = useToast();

    const fetchPeople = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.person_type) params.set("person_type", filters.person_type);
            if (filters.status) params.set("status", filters.status);
            if (filters.department) params.set("department", filters.department);
            if (filters.search) params.set("search", filters.search);
            params.set("skip", skip.toString());
            params.set("limit", "50");
            const { data } = await api.get<PersonListResponse>(`/api/v1/people?${params}`);
            setPeople(data.items);
            setTotal(data.total);
        } catch {
            showToast("Failed to load people", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPeople(); }, [skip, filters.person_type, filters.status]);

    const handleSearch = () => { setSkip(0); fetchPeople(); };

    const [form, setForm] = useState<PersonCreate>({ person_type: "INTERN", full_name: "" });

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/api/v1/people", form);
            showToast("Person created successfully");
            setShowCreate(false);
            setForm({ person_type: "INTERN", full_name: "" });
            fetchPeople();
        } catch {
            showToast("Failed to create person", "error");
        }
    };

    const getBadgeClass = (status: string) => {
        switch (status) {
            case "ACTIVE": return "badge-success";
            case "INACTIVE": return "badge-danger";
            case "DRAFT": return "badge-neutral";
            case "INVITED": return "badge-warning";
            case "EXITED": return "badge-info";
            default: return "badge-neutral";
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "EMPLOYEE": return "badge-info";
            case "INTERN": return "badge-accent";
            case "STUDENT": return "badge-warning";
            default: return "badge-neutral";
        }
    };

    return (
        <div>
            {/* Filters */}
            <div className="glass-card" style={{ padding: "20px", marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 200px" }}>
                        <label className="input-label">Search</label>
                        <input
                            className="input-field"
                            placeholder="Search by name or email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                    </div>
                    <div style={{ flex: "0 0 160px" }}>
                        <label className="input-label">Type</label>
                        <select className="input-field" value={filters.person_type} onChange={(e) => setFilters({ ...filters, person_type: e.target.value })}>
                            <option value="">All Types</option>
                            <option value="INTERN">Intern</option>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="STUDENT">Student</option>
                        </select>
                    </div>
                    <div style={{ flex: "0 0 160px" }}>
                        <label className="input-label">Status</label>
                        <select className="input-field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                            <option value="">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="INVITED">Invited</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="EXITED">Exited</option>
                        </select>
                    </div>
                    <button className="btn-secondary" onClick={handleSearch}>Search</button>
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add Person</button>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card" style={{ overflow: "hidden" }}>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                        <div className="spinner spinner-lg" />
                    </div>
                ) : people.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                        <p>No people found. Add your first person to get started.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Type</th>
                                        <th>Department</th>
                                        <th>Status</th>
                                        <th>Join Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {people.map((p) => (
                                        <tr key={p.id}>
                                            <td style={{ fontFamily: "monospace", fontSize: "13px", color: "var(--text-muted)" }}>{p.person_code}</td>
                                            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.full_name}</td>
                                            <td>{p.email || "—"}</td>
                                            <td><span className={`badge ${getTypeBadge(p.person_type)}`}>{p.person_type}</span></td>
                                            <td>{p.department || "—"}</td>
                                            <td><span className={`badge ${getBadgeClass(p.status)}`}>{p.status}</span></td>
                                            <td>{p.join_date || "—"}</td>
                                            <td>
                                                <Link href={`/people/${p.id}`} className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)" }}>
                            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Showing {people.length} of {total}</span>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button className="btn-secondary btn-sm" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - 50))}>Previous</button>
                                <button className="btn-secondary btn-sm" disabled={skip + 50 >= total} onClick={() => setSkip(skip + 50)}>Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create Modal */}
            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Person">
                <form onSubmit={handleCreate}>
                    <div className="form-grid">
                        <div className="form-full">
                            <label className="input-label">Full Name *</label>
                            <input className="input-field" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" />
                        </div>
                        <div>
                            <label className="input-label">Person Type *</label>
                            <select className="input-field" value={form.person_type} onChange={(e) => setForm({ ...form, person_type: e.target.value })}>
                                <option value="INTERN">Intern</option>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="STUDENT">Student</option>
                            </select>
                        </div>
                        <div>
                            <label className="input-label">Email</label>
                            <input className="input-field" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value || null })} placeholder="Email" />
                        </div>
                        <div>
                            <label className="input-label">Phone</label>
                            <input className="input-field" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value || null })} placeholder="Phone" />
                        </div>
                        <div>
                            <label className="input-label">Department</label>
                            <input className="input-field" value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value || null })} placeholder="Department" />
                        </div>
                        <div>
                            <label className="input-label">Date of Birth</label>
                            <input className="input-field" type="date" value={form.date_of_birth || ""} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value || null })} />
                        </div>
                        <div>
                            <label className="input-label">Join Date</label>
                            <input className="input-field" type="date" value={form.join_date || ""} onChange={(e) => setForm({ ...form, join_date: e.target.value || null })} />
                        </div>
                        <div className="form-full">
                            <label className="input-label">Address</label>
                            <input className="input-field" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value || null })} placeholder="Address" />
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">Create Person</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
