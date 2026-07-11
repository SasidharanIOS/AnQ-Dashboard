import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3, BriefcaseBusiness, Building2, CalendarCheck2, ClipboardList, CreditCard,
  FileText, Folder, Headphones, HelpCircle, LayoutDashboard, LogOut, MessageSquare,
  PackageCheck, Settings, ShieldCheck, Truck, UserRound, UsersRound
} from "lucide-react";
import Logo from "../common/Logo.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const navs = {
  customer: [
    ["dashboard", "Dashboard", LayoutDashboard], ["my-move", "My Move", Truck], ["quotes", "Quotes", CreditCard],
    ["messages", "Messages", MessageSquare, 3], ["payments", "Payments", CreditCard], ["documents", "Documents", Folder],
    ["profile", "Profile", UserRound], ["support", "Help & Support", Headphones]
  ],
  vendor: [
    ["dashboard", "Dashboard", LayoutDashboard], ["new-leads", "New Leads", BriefcaseBusiness, 6], ["assigned-jobs", "Assigned Jobs", ClipboardList, 8],
    ["quotes", "Quotes", CreditCard], ["messages", "Messages", MessageSquare, 3], ["documents", "Documents", Folder],
    ["completed-jobs", "Completed Jobs", CalendarCheck2], ["payments", "Payments", CreditCard], ["company-profile", "Company Profile", ShieldCheck], ["support", "Help & Support", Headphones]
  ],
  admin: [
    ["dashboard", "Dashboard", LayoutDashboard], ["jobs", "Jobs", Truck], ["customers", "Customers", UsersRound], ["vendors", "Vendors", Building2],
    ["assignments", "Assignments", BriefcaseBusiness], ["messages", "Messages", MessageSquare, 8], ["payments", "Payments", CreditCard],
    ["analytics", "Analytics", BarChart3], ["audit-logs", "Audit Logs", FileText], ["settings", "Settings", Settings]
  ]
};

function TrustCard({ role }) {
  if (role === "vendor") {
    return <div className="side-card rating-card"><p className="stars">★ ★ ★ ★ ◩</p><strong>Excellent</strong><p className="rating-boxes">★ ★ ★ ★ ◩</p><b>4.8 out of 5</b><span>2,300+ reviews</span><em>★ Trustpilot</em></div>;
  }
  if (role === "admin") {
    return <div className="side-card rating-card"><p className="stars">★ Platform Rating</p><p className="rating-boxes">★ ★ ★ ★ ◩</p><b>4.8 out of 5</b><span>2,340+ reviews</span><em>★ Trustpilot</em></div>;
  }
  return <div className="side-card protected-card"><ShieldCheck size={31} /><strong>Your move is protected</strong><p>All movers on AnQ Movers are verified and reviewed.</p><b>020 8064 1234</b></div>;
}

function HelpCard({ role }) {
  return <div className="side-card help-card"><Headphones size={34} /><strong>{role === "admin" ? "Need support?" : "Need help?"}</strong><p>{role === "admin" ? "Our admin team is here to help you 24/7" : "Our team is here to help you 24/7."}</p><b>020 8064 1234</b><span><i /> Live chat available</span></div>;
}

export default function Sidebar({ role }) {
  const { logout } = useAuth();
  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo"><Logo /></div>
      <nav className="sidebar-nav">
        {navs[role].map(([path, label, Icon, badge]) => (
          <NavLink key={path} to={`/${role}/${path}`} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Icon size={19} strokeWidth={2} />
            <span>{label}</span>
            {badge ? <small>{badge}</small> : null}
          </NavLink>
        ))}
        <button className="nav-item logout" onClick={logout}><LogOut size={19} /><span>Logout</span></button>
      </nav>
      <div className="sidebar-bottom">
        <TrustCard role={role} />
        <HelpCard role={role} />
      </div>
    </aside>
  );
}
