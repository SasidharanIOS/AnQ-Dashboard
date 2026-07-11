import React, { useMemo } from "react";
import { BarChart3, BriefcaseBusiness, CheckCircle2, Clock, UsersRound, WalletCards } from "lucide-react";
import { dashboardAPI } from "../../services/api.js";
import { adminDashboard as fallback } from "../../data/mockData.js";
import { mapAdminDashboard } from "../../utils/mappers.js";
import { useAsyncData } from "../../hooks/useAsyncData.js";
import { CardPanel, StatCard, StatusPill } from "../../components/ui/PortalUI.jsx";

export default function AdminDashboard() {
  const { data: apiData } = useAsyncData(() => dashboardAPI.get("admin"), [], null);
  const data = useMemo(() => mapAdminDashboard(apiData), [apiData]);
  const stats = data.stats || fallback.stats;
  const jobs = data.jobs?.length ? data.jobs : fallback.jobs;
  return <div className="page-wrap"><section className="trust-strip"><div className="card hero-card"><div className="hero-icon"><BarChart3 size={25}/></div><div><h2>Admin Portal - Operational Control</h2><p>Complete overview of jobs, customers, vendors, payments and analytics.</p></div></div><div className="card trust-mini"><UsersRound size={27}/><div><b>Role-based access</b><span>Data protection</span></div></div><div className="card trust-mini"><BriefcaseBusiness size={27}/><div><b>Operational Control</b><span>Jobs and vendors</span></div></div><div className="card trust-mini"><BarChart3 size={27}/><div><b>Data Driven</b><span>Real-time insights</span></div></div></section><div className="stat-grid">{stats.map((s)=><StatCard key={s.label} label={s.label} value={s.value} sub={s.change} tone={s.tone} icon={s.label.includes("Deposit")?WalletCards:s.label.includes("Progress")?Clock:s.label.includes("Completed")?CheckCircle2:BriefcaseBusiness}/>)}</div><div className="content-grid-wide"><CardPanel title="Jobs Management" subtitle="Manage active jobs and track progress."><div className="table-scroll"><table><thead><tr><th>Job ID</th><th>Customer</th><th>Move Date</th><th>Status</th><th>Assigned Vendor</th><th>Amount</th></tr></thead><tbody>{jobs.slice(0,6).map(j=><tr key={j.jobId}><td><b>{j.jobId}</b></td><td>{j.customer}<small>{j.customerId}</small></td><td>{j.date}</td><td><StatusPill value={j.status}/></td><td>{j.vendor||"—"}</td><td>{j.amount||"£750"}</td></tr>)}</tbody></table></div></CardPanel><CardPanel title="Recent Activity" subtitle="Latest system changes."><div className="progress-list">{(data.activity?.length?data.activity:fallback.activity).map((a,i)=><div className="step-row" key={a}><div className="step-dot done">{i+1}</div><div><b>{a}</b><span>Just now</span></div></div>)}</div></CardPanel></div></div>;
}
