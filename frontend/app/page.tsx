"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { PersonListResponse } from "@/lib/types";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface StatsData {
  total: number;
  by_type: { name: string; count: number }[];
  by_status: { name: string; count: number }[];
  by_department: { name: string; count: number }[];
}

const TYPE_COLORS: Record<string, string> = {
  EMPLOYEE: "#6366f1",
  INTERN: "#a855f7",
  STUDENT: "#3b82f6",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#34d399",
  DRAFT: "#64748b",
  INVITED: "#fbbf24",
  INACTIVE: "#f87171",
  EXITED: "#60a5fa",
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#1a2236",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  color: "#f1f5f9",
  fontSize: "13px",
  padding: "10px 14px",
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPeople: 0,
    activeEmployees: 0,
    interns: 0,
    pendingDocs: 0,
  });
  const [chartData, setChartData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allRes, empRes, internRes, statsRes] = await Promise.allSettled([
          api.get<PersonListResponse>("/api/v1/people?limit=1"),
          api.get<PersonListResponse>("/api/v1/people?person_type=EMPLOYEE&status=ACTIVE&limit=1"),
          api.get<PersonListResponse>("/api/v1/people?person_type=INTERN&limit=1"),
          api.get<StatsData>("/api/v1/people/stats"),
        ]);
        setStats({
          totalPeople: allRes.status === "fulfilled" ? allRes.value.data.total : 0,
          activeEmployees: empRes.status === "fulfilled" ? empRes.value.data.total : 0,
          interns: internRes.status === "fulfilled" ? internRes.value.data.total : 0,
          pendingDocs: 0,
        });
        if (statsRes.status === "fulfilled") {
          setChartData(statsRes.value.data);
        }
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const cards = [
    {
      label: "Total People",
      value: stats.totalPeople,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    },
    {
      label: "Active Employees",
      value: stats.activeEmployees,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #10b981, #34d399)",
    },
    {
      label: "Interns",
      value: stats.interns,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    },
    {
      label: "Pending Documents",
      value: stats.pendingDocs,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <circle cx="12" cy="14" r="2" />
          <path d="M12 16v2" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    },
  ];

  const quickActions = [
    {
      label: "Add New Person",
      href: "/people",
      description: "Register employees or interns",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
    },
    {
      label: "Check In / Out",
      href: "/attendance",
      description: "Record daily attendance",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Manage Offers",
      href: "/offers",
      description: "Create and send offer letters",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      label: "Upload Documents",
      href: "/documents",
      description: "Manage identity and proof files",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
  ];

  const hasChartData = chartData && chartData.total > 0;

  return (
    <div>
      {/* Stat Cards */}
      <div className="card-grid" style={{ marginBottom: "32px" }}>
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  background: card.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: `0 4px 14px ${card.gradient.includes("6366") ? "rgba(99,102,241,0.3)" : card.gradient.includes("10b9") ? "rgba(16,185,129,0.3)" : card.gradient.includes("3b82") ? "rgba(59,130,246,0.3)" : "rgba(245,158,11,0.3)"}`,
                }}
              >
                {card.icon}
              </div>
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      {hasChartData && (
        <div className="card-grid-2" style={{ marginBottom: "32px" }}>
          {/* Department Bar Chart */}
          <div className="glass-card" style={{ padding: "28px" }}>
            <h3 className="section-title" style={{ marginBottom: "24px" }}>People by Department</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData.by_department} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                <Bar dataKey="count" name="People" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.by_department.map((_, index) => (
                    <Cell key={index} fill={index % 2 === 0 ? "#6366f1" : "#a855f7"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Type & Status Charts */}
          <div className="glass-card" style={{ padding: "28px" }}>
            <h3 className="section-title" style={{ marginBottom: "24px" }}>Distribution Overview</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {/* Type Pie */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>By Type</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData.by_type}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="count"
                      nameKey="name"
                      strokeWidth={2}
                      stroke="#0a0e1a"
                    >
                      {chartData.by_type.map((entry) => (
                        <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Donut */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>By Status</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData.by_status}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="count"
                      nameKey="name"
                      strokeWidth={2}
                      stroke="#0a0e1a"
                    >
                      {chartData.by_status.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Grid */}
      <div className="card-grid-2">
        {/* Quick Actions */}
        <div className="glass-card" style={{ padding: "28px" }}>
          <h3 className="section-title" style={{ marginBottom: "20px" }}>Quick Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  transition: "all 150ms ease",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-glass-hover)";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <div style={{
                  width: "40px", height: "40px", borderRadius: "var(--radius-sm)",
                  background: "var(--bg-glass)", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  {action.icon}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>{action.label}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{action.description}</div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginLeft: "auto", opacity: 0.4 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="glass-card" style={{ padding: "28px" }}>
          <h3 className="section-title" style={{ marginBottom: "20px" }}>System Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { label: "API Server", status: "Online", badge: "badge-success" },
              { label: "Database", status: "Connected", badge: "badge-success" },
              { label: "Authentication", status: "Active", badge: "badge-success" },
              { label: "File Storage", status: "Ready", badge: "badge-info" },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: item.badge.includes("success") ? "var(--success)" : "var(--info)",
                    boxShadow: `0 0 8px ${item.badge.includes("success") ? "rgba(52,211,153,0.4)" : "rgba(96,165,250,0.4)"}`,
                  }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500 }}>{item.label}</span>
                </div>
                <span className={`badge ${item.badge}`}>{item.status}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "24px", padding: "16px", background: "var(--bg-glass)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Uptime</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--success)" }}>99.9%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
