"use client";

import { useEffect, useState, FormEvent, use } from "react";
import api from "@/lib/api";
import type { PersonResponse, PersonUpdate } from "@/lib/types";
import { useToast } from "@/components/toast";
import { useRouter } from "next/navigation";

export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [person, setPerson] = useState<PersonResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<PersonUpdate>({});
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await api.get<PersonResponse>(`/api/v1/people/${id}`);
                setPerson(data);
                setForm({
                    full_name: data.full_name,
                    email: data.email,
                    phone: data.phone,
                    date_of_birth: data.date_of_birth,
                    address: data.address,
                    department: data.department,
                    join_date: data.join_date,
                    end_date: data.end_date,
                    status: data.status,
                    person_type: data.person_type,
                });
            } catch {
                showToast("Person not found", "error");
                router.push("/people");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.patch<PersonResponse>(`/api/v1/people/${id}`, form);
            setPerson(data);
            setEditing(false);
            showToast("Person updated successfully");
        } catch {
            showToast("Failed to update person", "error");
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    if (!person) return null;

    const getBadgeClass = (status: string) => {
        switch (status) {
            case "ACTIVE": return "badge-success";
            case "INACTIVE": return "badge-danger";
            case "ONBOARDING": return "badge-warning";
            default: return "badge-neutral";
        }
    };

    return (
        <div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                <button className="btn-secondary btn-sm" onClick={() => router.push("/people")}>← Back</button>
            </div>

            <div className="glass-card" style={{ padding: "32px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <div style={{
                            width: "56px", height: "56px", borderRadius: "var(--radius-lg)",
                            background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "22px", color: "white",
                        }}>
                            {person.full_name.charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>{person.full_name}</h2>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "monospace" }}>{person.person_code}</span>
                                <span className={`badge ${getBadgeClass(person.status)}`}>{person.status}</span>
                                <span className="badge badge-info">{person.person_type}</span>
                            </div>
                        </div>
                    </div>
                    {!editing && (
                        <button className="btn-primary btn-sm" onClick={() => setEditing(true)}>Edit</button>
                    )}
                </div>

                {editing ? (
                    <form onSubmit={handleUpdate}>
                        <div className="form-grid">
                            <div>
                                <label className="input-label">Full Name</label>
                                <input className="input-field" value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="input-label">Email</label>
                                <input className="input-field" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value || null })} />
                            </div>
                            <div>
                                <label className="input-label">Phone</label>
                                <input className="input-field" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value || null })} />
                            </div>
                            <div>
                                <label className="input-label">Department</label>
                                <input className="input-field" value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value || null })} />
                            </div>
                            <div>
                                <label className="input-label">Person Type</label>
                                <select className="input-field" value={form.person_type || ""} onChange={(e) => setForm({ ...form, person_type: e.target.value })}>
                                    <option value="INTERN">Intern</option>
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="STUDENT">Student</option>
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Status</label>
                                <select className="input-field" value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="ONBOARDING">Onboarding</option>
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Date of Birth</label>
                                <input className="input-field" type="date" value={form.date_of_birth || ""} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value || null })} />
                            </div>
                            <div>
                                <label className="input-label">Join Date</label>
                                <input className="input-field" type="date" value={form.join_date || ""} onChange={(e) => setForm({ ...form, join_date: e.target.value || null })} />
                            </div>
                            <div>
                                <label className="input-label">End Date</label>
                                <input className="input-field" type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value || null })} />
                            </div>
                            <div className="form-full">
                                <label className="input-label">Address</label>
                                <input className="input-field" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value || null })} />
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                            <button type="submit" className="btn-primary">Save Changes</button>
                        </div>
                    </form>
                ) : (
                    <div className="form-grid">
                        {[
                            { label: "Email", value: person.email },
                            { label: "Phone", value: person.phone },
                            { label: "Department", value: person.department },
                            { label: "Date of Birth", value: person.date_of_birth },
                            { label: "Join Date", value: person.join_date },
                            { label: "End Date", value: person.end_date },
                            { label: "Address", value: person.address },
                            { label: "Created At", value: new Date(person.created_at).toLocaleDateString() },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                                <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>{value || "—"}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
