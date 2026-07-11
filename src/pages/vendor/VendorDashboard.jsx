import React, { useMemo } from "react";
import { BriefcaseBusiness, CheckCircle2, FileText, MessageSquare, ShieldCheck, WalletCards } from "lucide-react";
import { dashboardAPI } from "../../services/api.js";
import { vendorDashboard as fallback } from "../../data/mockData.js";
import { mapVendorDashboard } from "../../utils/mappers.js";
import { useAsyncData } from "../../hooks/useAsyncData.js";
import { CardPanel, StatCard, StatusPill } from "../../components/ui/PortalUI.jsx";

export default function VendorDashboard() {
  const { data: apiData } = useAsyncData(() => dashboardAPI.get("vendor"), [], null);
  const data = useMemo(() => mapVendorDashboard(apiData), [apiData]);
  const lead = data.lead || fallback.lead;
  return <div className="dash-page page-wrap"><section className="trust-strip"><div className="card hero-card"><div className="hero-icon"><BriefcaseBusiness size={25} /></div><div><h2>AnQ Movers Vendor Portal</h2><p>Manage leads, quotes, jobs, messages, documents and payments.</p></div></div><div className="card trust-mini"><ShieldCheck size={27} /><div><b>Secure & Trusted</b><span>Verified vendors</span></div></div><div className="card trust-mini"><MessageSquare size={27} /><div><b>Real-time Updates</b><span>Lead alerts</span></div></div><div className="card trust-mini"><FileText size={27} /><div><b>Easy Management</b><span>All in one place</span></div></div></section><div className="stat-grid">{data.stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} tone={s.tone} icon={s.label.includes("Lead") ? BriefcaseBusiness : s.label.includes("Quote") ? FileText : s.label.includes("Won") ? CheckCircle2 : WalletCards} />)}</div><div className="content-grid-2"><CardPanel title="Highlighted Lead" subtitle="Quote request received from customer."><div className="details-clean-grid"><b>Job ID</b><span>{lead.jobId}</span><b>Route</b><span>{lead.from} → {lead.to}</span><b>Move Date</b><span>{lead.date}</span><b>Property</b><span>{lead.property}</span><b>Match</b><span>{lead.match}%</span><b>Status</b><span><StatusPill value={lead.status} /></span></div><div className="modal-actions"><button className="red-btn">Submit Quote</button><button className="outline-btn">View Lead</button></div></CardPanel><CardPanel title="Recent Messages" subtitle="Customer conversations."><div className="progress-list">{(data.messages || fallback.messages).map((m) => <div className="chat-item" key={`${m.name}-${m.time}`}><div className="vendor-badge" style={{ width: 34, height: 34, fontSize: 12 }}>{m.logo}</div><div><b>{m.name}</b><p>{m.text}</p><small>{m.time}</small></div></div>)}</div></CardPanel></div></div>;
}
