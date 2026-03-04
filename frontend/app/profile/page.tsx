"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";
import type { PersonResponse, PersonSelfUpdate } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/toast";

export default function ProfilePage() {
    const { user } = useAuth();
    const [person, setPerson] = useState<PersonResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<PersonSelfUpdate>({});
    const { showToast } = useToast();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get<PersonResponse>("/api/v1/me/profile");
                setPerson(data);
                setForm({ phone: data.phone, address: data.address });
            } catch {
                // No linked person record
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.patch<PersonResponse>("/api/v1/me/profile", form);
            setPerson(data);
            setEditing(false);
            showToast("Profile updated");
        } catch {
            showToast("Failed to update", "error");
        }
    };

    if (loading) {
        return <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><div className="spinner spinner-lg" /></div>;
    }

    return (
        <div style={{ maxWidth: "700px" }}>
            {/* Account Info */}
            <div className="glass-card" style={{ padding: "32px", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Account Information</h3>
                <div className="form-grid">
                    <div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Email</div>
                        <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>{user?.email}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Role</div>
                        <div><span className="badge badge-accent">{user?.role}</span></div>
                    </div>
                    <div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Account Status</div>
                        <div><span className={`badge ${user?.is_active ? "badge-success" : "badge-danger"}`}>{user?.is_active ? "Active" : "Inactive"}</span></div>
                    </div>
                    <div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Member Since</div>
                        <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>{user ? new Date(user.created_at).toLocaleDateString() : "—"}</div>
                    </div>
                </div>
            </div>

            {/* Person Profile */}
            {person ? (
                <div className="glass-card" style={{ padding: "32px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Person Profile</h3>
                        {!editing && <button className="btn-primary btn-sm" onClick={() => setEditing(true)}>Edit</button>}
                    </div>

                    {editing ? (
                        <form onSubmit={handleUpdate}>
                            <div className="form-grid">
                                <div>
                                    <label className="input-label">Phone</label>
                                    <input className="input-field" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value || null })} placeholder="Phone number" />
                                </div>
                                <div className="form-full">
                                    <label className="input-label">Address</label>
                                    <input className="input-field" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value || null })} placeholder="Full address" />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    ) : (
                        <div className="form-grid">
                            {[
                                { label: "Full Name", value: person.full_name },
                                { label: "Person Code", value: person.person_code },
                                { label: "Type", value: person.person_type },
                                { label: "Department", value: person.department },
                                { label: "Phone", value: person.phone },
                                { label: "Email", value: person.email },
                                { label: "Status", value: person.status },
                                { label: "Join Date", value: person.join_date },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</div>
                                    <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>{value || "—"}</div>
                                </div>
                            ))}
                            <div className="form-full">
                                <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Address</div>
                                <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>{person.address || "—"}</div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card" style={{ padding: "32px" }}>
                    <div className="empty-state">
                        <p>No person profile linked to your account yet.<br />Contact your admin to create one.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
