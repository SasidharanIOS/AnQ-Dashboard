import React, { useMemo } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  UsersRound,
  WalletCards
} from "lucide-react";

import { dashboardAPI, money } from "../../services/api.js";
import { useAsyncData } from "../../hooks/useAsyncData.js";
import {
  CardPanel,
  StatCard,
  StatusPill
} from "../../components/ui/PortalUI.jsx";

const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const cleanStatus = (value) =>
  String(value || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getDashboardStats = (data = {}) => {
  const cards = data.cards || data.stats || data.analytics_summary || {};

  if (Array.isArray(cards)) return cards;

  return [
    {
      label: "Total Jobs",
      value:
        cards.total_jobs ||
        data.total_jobs ||
        data.job_management?.total_jobs ||
        0,
      sub: "Live backend",
      tone: "blue",
      icon: BriefcaseBusiness
    },
    {
      label: "In Progress",
      value:
        cards.in_progress_jobs ||
        data.in_progress_jobs ||
        data.job_management?.in_progress ||
        0,
      sub: "Active moves",
      tone: "navy",
      icon: Clock
    },
    {
      label: "Completed",
      value:
        cards.completed_jobs ||
        data.completed_jobs ||
        data.job_management?.completed ||
        0,
      sub: "Finished jobs",
      tone: "green",
      icon: CheckCircle2
    },
    {
      label: "Total Deposits",
      value: money(
        cards.total_deposits ||
          data.total_deposits ||
          data.payments_overview?.total_deposits ||
          0
      ),
      sub: "Stripe payments",
      tone: "purple",
      icon: WalletCards
    }
  ];
};

const getJobs = (data = {}) => {
  return safeArray(
    data.jobs ||
      data.job_management?.jobs ||
      data.recent_jobs ||
      data.active_jobs
  );
};

const getActivity = (data = {}) => {
  return safeArray(
    data.recent_activity ||
      data.activity ||
      data.audit_logs ||
      data.notifications
  );
};

export default function AdminDashboard() {
  const { data: apiData, loading, error } = useAsyncData(
    () => dashboardAPI.get("admin"),
    [],
    null
  );

  const data = apiData || {};

  const stats = useMemo(() => getDashboardStats(data), [data]);
  const jobs = useMemo(() => getJobs(data), [data]);
  const activity = useMemo(() => getActivity(data), [data]);

  return (
    <div className="admin-dashboard-page">
      <section className="trust-strip">
        <div className="card hero-card">
          <div className="hero-icon">
            <BarChart3 size={25} />
          </div>

          <div>
            <h2>Admin Portal - Operational Control</h2>
            <p>
              Complete overview of jobs, customers, vendors, payments and
              analytics.
            </p>
          </div>
        </div>

        <div className="card trust-mini">
          <UsersRound size={27} />
          <div>
            <b>Role-based access</b>
            <span>Data protection</span>
          </div>
        </div>

        <div className="card trust-mini">
          <BriefcaseBusiness size={27} />
          <div>
            <b>Operational Control</b>
            <span>Jobs and vendors</span>
          </div>
        </div>

        <div className="card trust-mini">
          <BarChart3 size={27} />
          <div>
            <b>Data Driven</b>
            <span>Real-time insights</span>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="card module-table">
          <div className="empty-state">Loading admin dashboard...</div>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="card module-table">
          <div className="empty-state">
            {error.message || "Failed to load admin dashboard."}
          </div>
        </section>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="stat-grid">
            {stats.map((stat) => {
              const Icon = stat.icon || BriefcaseBusiness;

              return (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  sub={stat.sub || stat.change || "Live backend"}
                  tone={stat.tone || "blue"}
                  icon={Icon}
                />
              );
            })}
          </div>

          <div className="content-grid-wide">
            <CardPanel
              title="Jobs Management"
              subtitle="Manage active jobs and track progress."
            >
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>Customer</th>
                      <th>Move Date</th>
                      <th>Status</th>
                      <th>Assigned Vendor</th>
                      <th>Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {jobs.slice(0, 8).map((job) => (
                      <tr key={job.id || job.job_id}>
                        <td>
                          <b>{job.job_id || `ANQ-${job.id}`}</b>
                        </td>

                        <td>
                          {job.customer?.full_name ||
                            job.customer_name ||
                            "Customer"}
                          <small>
                            {job.customer_id ? `CUS-${job.customer_id}` : "—"}
                          </small>
                        </td>

                        <td>{job.moving_date || job.date || "—"}</td>

                        <td>
                          <StatusPill value={job.status} />
                        </td>

                        <td>
                          {job.selected_vendor?.company_name ||
                            job.assigned_vendor_name ||
                            "—"}
                        </td>

                        <td>
                          {job.amount
                            ? money(job.amount)
                            : job.quote_amount
                              ? money(job.quote_amount)
                              : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!jobs.length ? (
                  <div className="empty-state">No live backend jobs found.</div>
                ) : null}
              </div>
            </CardPanel>

            <CardPanel title="Recent Activity" subtitle="Latest system changes.">
              <div className="progress-list">
                {activity.length ? (
                  activity.slice(0, 8).map((item, index) => (
                    <div className="step-row" key={item.id || index}>
                      <div className="step-dot done">{index + 1}</div>

                      <div>
                        <b>
                          {item.title ||
                            item.action ||
                            item.message ||
                            "System activity"}
                        </b>

                        <span>
                          {item.created_at ||
                            item.date ||
                            item.timestamp ||
                            "Just now"}
                        </span>

                        {item.module ? <p>{item.module}</p> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No recent activity found.</div>
                )}
              </div>
            </CardPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}