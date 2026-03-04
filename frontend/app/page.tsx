"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { PersonListResponse } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPeople: 0,
    activeEmployees: 0,
    interns: 0,
    pendingDocs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allRes, empRes, internRes] = await Promise.allSettled([
          api.get<PersonListResponse>("/api/v1/people?limit=1"),
          api.get<PersonListResponse>("/api/v1/people?person_type=EMPLOYEE&status=ACTIVE&limit=1"),
          api.get<PersonListResponse>("/api/v1/people?person_type=INTERN&limit=1"),
        ]);
        setStats({
          totalPeople: allRes.status === "fulfilled" ? allRes.value.data.total : 0,
          activeEmployees: empRes.status === "fulfilled" ? empRes.value.data.total : 0,
          interns: internRes.status === "fulfilled" ? internRes.value.data.total : 0,
          pendingDocs: 0,
        });
      } catch {
        // stats will remain at 0
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const cards = [
    { label: "Total People", value: stats.totalPeople, color: "var(--accent)" },
    { label: "Active Employees", value: stats.activeEmployees, color: "var(--success)" },
    { label: "Interns", value: stats.interns, color: "var(--info)" },
    { label: "Pending Documents", value: stats.pendingDocs, color: "var(--warning)" },
  ];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>
            Quick Actions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <a href="/people" className="sidebar-link" style={{ borderRadius: "var(--radius-md)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Add New Person
            </a>
            <a href="/attendance" className="sidebar-link" style={{ borderRadius: "var(--radius-md)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Check In / Out
            </a>
            <a href="/offers" className="sidebar-link" style={{ borderRadius: "var(--radius-md)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Manage Offers
            </a>
            <a href="/documents" className="sidebar-link" style={{ borderRadius: "var(--radius-md)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Upload Documents
            </a>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>
            System Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>API Status</span>
              <span className="badge badge-success">Online</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Active Sessions</span>
              <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }}>1</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Database</span>
              <span className="badge badge-success">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
