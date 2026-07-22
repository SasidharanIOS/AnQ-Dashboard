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

const normalizeRole = (value) => {
  const role = String(value || "").toLowerCase().trim();

  if (role === "super_admin") return "admin";
  if (role === "admin") return "admin";
  if (role === "vendor") return "vendor";
  if (role === "customer") return "customer";

  if (role.includes("super_admin")) return "admin";
  if (role.includes("admin")) return "admin";
  if (role.includes("vendor")) return "vendor";
  if (role.includes("customer")) return "customer";

  return "";
};

const getStoredRole = () => {
  return normalizeRole(
    localStorage.getItem("anq_selected_role") ||
      localStorage.getItem("anq_role") ||
      localStorage.getItem("role")
  );
};

const getDashboardPath = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") return "/admin/dashboard";
  if (normalizedRole === "vendor") return "/vendor/dashboard";
  if (normalizedRole === "customer") return "/customer/dashboard";

  return "/login";
};

const hasTokenInStorage = () => {
  return Boolean(
    localStorage.getItem("anq_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("access_token")
  );
};

export default function RoleLayout({ role }) {
  const { user } = useAuth();
  const location = useLocation();

  const routeRole = normalizeRole(role);

  const title = useMemo(() => {
    if (titles[location.pathname]) return titles[location.pathname];

    const last =
      location.pathname.split("/").filter(Boolean).pop() || "dashboard";

    return last
      .split("-")
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .join(" ");
  }, [location.pathname]);

  const storedRole = getStoredRole();

  const userRole = normalizeRole(
    storedRole ||
      user?.role ||
      user?.user_role ||
      user?.user_type ||
      user?.type
  );

  const isLoggedIn = Boolean(user || hasTokenInStorage());

  if (!isLoggedIn) {
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }

    return null;
  }

  if (!userRole) {
    localStorage.clear();

    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }

    return null;
  }

  if (routeRole && userRole !== routeRole) {
    const correctDashboard = getDashboardPath(userRole);

    if (location.pathname !== correctDashboard) {
      return <Navigate to={correctDashboard} replace />;
    }

    return null;
  }

  return (
    <div className="app-shell">
      <Sidebar role={routeRole || userRole} />

      <section className="app-workspace">
        <Topbar title={title} role={routeRole || userRole} />

        <main className="main-area">
          <Outlet />
        </main>
      </section>
    </div>
  );
}