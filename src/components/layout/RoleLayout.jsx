import React, { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

const titles = {
  "/customer/dashboard": "Customer Dashboard",
  "/customer/my-move": "My Move",
  "/customer/quotes": "Quotes Received",
  "/customer/messages": "Messages with Vendors",
  "/customer/payments": "Payments / £50 Lock-in Deposit",
  "/customer/documents": "Documents",
  "/customer/profile": "Profile",
  "/customer/support": "Help & Support",
  "/vendor/dashboard": "Vendor Dashboard",
  "/vendor/new-leads": "New Leads / Quote Requests",
  "/vendor/assigned-jobs": "Assigned Jobs",
  "/vendor/quotes": "Quotes",
  "/vendor/messages": "Messages",
  "/vendor/documents": "Documents",
  "/vendor/completed-jobs": "Completed Jobs",
  "/vendor/payments": "Payments",
  "/vendor/company-profile": "Company Profile",
  "/vendor/support": "Help & Support",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/jobs": "Jobs Management",
  "/admin/customers": "Customers Management",
  "/admin/vendors": "Vendors Management",
  "/admin/assignments": "Assignments",
  "/admin/quotes": "Quotes",
  "/admin/messages": "Messages",
  "/admin/payments": "Payments",
  "/admin/analytics": "Analytics",
  "/admin/audit-logs": "Audit Logs",
  "/admin/settings": "Settings"
};

const normalizeRole = (role) => (role === "super_admin" ? "admin" : role);

export default function RoleLayout({ role }) {
  const { user } = useAuth();
  const location = useLocation();

  const title = useMemo(() => {
    if (titles[location.pathname]) return titles[location.pathname];
    const last = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
    return last
      .split("-")
      .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
      .join(" ");
  }, [location.pathname]);

  if (!user) return <Navigate to="/login" replace />;

  const userRole = normalizeRole(user.role);
  if (userRole !== role) return <Navigate to={`/${userRole}/dashboard`} replace />;

  return (
    <div className="app-shell">
      <Sidebar role={role} />
      <section className="app-workspace">
        <Topbar title={title} role={role} />
        <main className="main-area"><Outlet /></main>
      </section>
    </div>
  );
}
