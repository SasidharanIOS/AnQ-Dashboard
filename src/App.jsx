import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import RoleLayout from "./components/layout/RoleLayout.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import LoginPage from "./pages/auth/LoginPage.jsx";
import PublicHome from "./pages/public/PublicHome.jsx";

import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";
import CustomerMyMovePage from "./pages/customer/CustomerMyMovePage.jsx";
import CustomerQuotesPage from "./pages/customer/CustomerQuotesPage.jsx";
import CustomerMessagesPage from "./pages/customer/CustomerMessagesPage.jsx";
import CustomerPaymentsPage from "./pages/customer/CustomerPaymentsPage.jsx";
import CustomerDocumentsPage from "./pages/customer/CustomerDocumentsPage.jsx";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage.jsx";
import CustomerSupportPage from "./pages/customer/CustomerSupportPage.jsx";

import VendorDashboard from "./pages/vendor/VendorDashboard.jsx";
import VendorNewLeadsPage from "./pages/vendor/VendorNewLeadsPage.jsx";
import VendorAssignedJobsPage from "./pages/vendor/VendorAssignedJobsPage.jsx";
import VendorQuotesPage from "./pages/vendor/VendorQuotesPage.jsx";
import VendorMessagesPage from "./pages/vendor/VendorMessagesPage.jsx";
import VendorDocumentsPage from "./pages/vendor/VendorDocumentsPage.jsx";
import VendorCompletedJobsPage from "./pages/vendor/VendorCompletedJobsPage.jsx";
import VendorPaymentsPage from "./pages/vendor/VendorPaymentsPage.jsx";
import VendorCompanyProfilePage from "./pages/vendor/VendorCompanyProfilePage.jsx";
import VendorSupportPage from "./pages/vendor/VendorSupportPage.jsx";
import AdminVendorDetailsPage from "./pages/admin/AdminVendorDetailsPage.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminJobsPage from "./pages/admin/AdminJobsPage.jsx";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage.jsx";
import AdminVendorsPage from "./pages/admin/AdminVendorsPage.jsx";
import AdminCreateVendorPage from "./pages/admin/AdminCreateVendorPage.jsx";
import AdminAssignmentsPage from "./pages/admin/AdminAssignmentsPage.jsx";
import AdminQuotesPage from "./pages/admin/AdminQuotesPage.jsx";
import AdminMessagesPage from "./pages/admin/AdminMessagesPage.jsx";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage.jsx";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage.jsx";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage.jsx";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage.jsx";

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const rolePath =
    user.role === "super_admin" || user.role === "admin"
      ? "admin"
      : user.role === "vendor"
        ? "vendor"
        : "customer";

  return <Navigate to={`/${rolePath}/dashboard`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/home" element={<PublicHome />} />

      <Route path="/login" element={<LoginPage />} />

      {/* CUSTOMER ROUTES */}
      <Route path="/customer" element={<RoleLayout role="customer" />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<CustomerDashboard />} />

        <Route path="my-move" element={<CustomerMyMovePage />} />

        <Route path="quotes" element={<CustomerQuotesPage />} />

        <Route path="messages" element={<CustomerMessagesPage />} />

        <Route path="payments" element={<CustomerPaymentsPage />} />

        <Route path="documents" element={<CustomerDocumentsPage />} />

        <Route path="profile" element={<CustomerProfilePage />} />

        <Route path="support" element={<CustomerSupportPage />} />

        <Route
          path="help-support"
          element={<Navigate to="../support" replace />}
        />
      </Route>

      {/* VENDOR ROUTES */}
      <Route path="/vendor" element={<RoleLayout role="vendor" />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<VendorDashboard />} />

        <Route path="new-leads" element={<VendorNewLeadsPage />} />

        <Route path="assigned-jobs" element={<VendorAssignedJobsPage />} />

        <Route path="quotes" element={<VendorQuotesPage />} />

        <Route path="messages" element={<VendorMessagesPage />} />

        <Route path="documents" element={<VendorDocumentsPage />} />

        <Route path="completed-jobs" element={<VendorCompletedJobsPage />} />

        <Route path="payments" element={<VendorPaymentsPage />} />

        <Route path="company-profile" element={<VendorCompanyProfilePage />} />

        <Route path="support" element={<VendorSupportPage />} />

        <Route
          path="help-support"
          element={<Navigate to="../support" replace />}
        />
      </Route>

      {/* ADMIN ROUTES */}
      <Route path="/admin" element={<RoleLayout role="admin" />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<AdminDashboard />} />

        <Route path="jobs" element={<AdminJobsPage />} />

        <Route path="customers" element={<AdminCustomersPage />} />

        <Route path="vendors" element={<AdminVendorsPage />} />

        <Route path="vendors/create" element={<AdminCreateVendorPage />} />

        <Route path="vendors/:vendorId" element={<AdminVendorDetailsPage />} />

        <Route path="assignments" element={<AdminAssignmentsPage />} />

        <Route path="quotes" element={<AdminQuotesPage />} />

        <Route path="messages" element={<AdminMessagesPage />} />

        <Route path="payments" element={<AdminPaymentsPage />} />

        <Route path="analytics" element={<AdminAnalyticsPage />} />

        <Route path="audit-logs" element={<AdminAuditLogsPage />} />

        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
