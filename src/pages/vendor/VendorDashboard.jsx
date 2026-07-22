import React, { useCallback, useMemo } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  MessageSquare,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { dashboardAPI } from "../../services/api.js";
import { vendorDashboard as fallback } from "../../data/mockData.js";
import { mapVendorDashboard } from "../../utils/mappers.js";
import { useAsyncData } from "../../hooks/useAsyncData.js";
import {
  CardPanel,
  StatCard,
  StatusPill,
} from "../../components/ui/PortalUI.jsx";

const VENDOR_DASHBOARD_DEPS = [];

const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const safeText = (value, fallbackValue = "—") => {
  if (value === null || value === undefined || value === "")
    return fallbackValue;
  return String(value);
};

const normalizeLead = (lead = {}) => {
  return {
    jobId: safeText(lead.jobId || lead.job_id || lead.id, "—"),
    from: safeText(
      lead.from || lead.pickup_postcode || lead.collection_postcode,
      "—",
    ),
    to: safeText(
      lead.to || lead.delivery_postcode || lead.destination_postcode,
      "—",
    ),
    date: safeText(
      lead.date || lead.moving_date || lead.preferred_date_from,
      "—",
    ),
    property: safeText(
      lead.property || lead.property_type || lead.property_size,
      "—",
    ),
    match: safeText(lead.match || lead.match_percentage || 0, "0"),
    status: lead.status || "new",
  };
};

const getStatIcon = (label = "") => {
  const lower = label.toLowerCase();

  if (lower.includes("lead")) return BriefcaseBusiness;
  if (lower.includes("quote")) return FileText;
  if (lower.includes("won") || lower.includes("completed")) return CheckCircle2;
  if (lower.includes("deposit") || lower.includes("payment"))
    return WalletCards;

  return BriefcaseBusiness;
};

export default function VendorDashboard() {
  const loadVendorDashboard = useCallback(() => {
    return dashboardAPI.get("vendor");
  }, []);

  const {
    data: apiData,
    loading,
    error,
  } = useAsyncData(loadVendorDashboard, VENDOR_DASHBOARD_DEPS, null);

  const data = useMemo(() => {
    const mapped = mapVendorDashboard(apiData || {});
    return mapped || {};
  }, [apiData]);

  const stats = useMemo(() => {
    const backendStats = safeArray(data.stats);
    const fallbackStats = safeArray(fallback.stats);

    return backendStats.length ? backendStats : fallbackStats;
  }, [data.stats]);

  const lead = useMemo(() => {
    return normalizeLead(data.lead || fallback.lead || {});
  }, [data.lead]);

  const messages = useMemo(() => {
    const backendMessages = safeArray(data.messages);
    const fallbackMessages = safeArray(fallback.messages);

    return backendMessages.length ? backendMessages : fallbackMessages;
  }, [data.messages]);

  return (
    <div className="dash-page page-wrap vendor-dashboard-page">
      {loading ? (
        <section className="card module-table">
          <div className="empty-state">Loading vendor dashboard...</div>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="card module-table">
          <div className="empty-state">
            {error.message || "Failed to load vendor dashboard."}
          </div>
        </section>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="stat-grid">
            {stats.map((stat) => {
              const Icon = getStatIcon(stat.label);

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

          <div className="content-grid-2">
            <CardPanel
  title="Highlighted Lead"
  subtitle="Latest quotation request waiting for your response."
>
  <div className="lead-header-card">
    <div className="lead-route">
      <h3>{lead.from}</h3>
      <div className="lead-arrow">→</div>
      <h3>{lead.to}</h3>
    </div>

    <StatusPill value={lead.status} />
  </div>

  <div className="lead-progress-horizontal">
    <div className="progress-line"></div>

    {[
      "Request",
      "Quote",
      "Accepted",
      "Pickup",
      "Delivered"
    ].map((step, index) => {
      const completed = index <= 1; // Change dynamically

      return (
        <div
          key={step}
          className={`progress-step ${
            completed ? "completed" : ""
          }`}
        >
          <div className="progress-circle">
            {completed ? "✓" : index + 1}
          </div>

          <span>{step}</span>
        </div>
      );
    })}
  </div>

  <div className="lead-summary-grid">

    <div className="summary-box">
      <small>Job ID</small>
      <strong>{lead.jobId}</strong>
    </div>

    <div className="summary-box">
      <small>Move Date</small>
      <strong>{lead.date}</strong>
    </div>

    <div className="summary-box">
      <small>Property</small>
      <strong>{lead.property}</strong>
    </div>

    <div className="summary-box">
      <small>Match Score</small>
      <strong>{lead.match}%</strong>
    </div>

  </div>

  <div className="modal-actions">
    <button className="red-btn">
      Submit Quote
    </button>

    <button className="outline-btn">
      View Full Details
    </button>
  </div>
</CardPanel>

            <CardPanel
              title="Recent Messages"
              subtitle="Customer conversations."
            >
              <div className="progress-list">
                {messages.length ? (
                  messages.map((message, index) => {
                    const name =
                      message.name ||
                      message.customer_name ||
                      message.customer?.full_name ||
                      "Customer";

                    const text =
                      message.text ||
                      message.message ||
                      message.last_message ||
                      "No message yet";

                    const time =
                      message.time ||
                      message.created_at ||
                      message.updated_at ||
                      "—";

                    const logo = message.logo || name.slice(0, 1).toUpperCase();

                    return (
                      <div
                        className="chat-item"
                        key={`${name}-${time}-${index}`}
                      >
                        <div
                          className="vendor-badge"
                          style={{
                            width: 34,
                            height: 34,
                            fontSize: 12,
                          }}
                        >
                          {logo}
                        </div>

                        <div>
                          <b>{name}</b>
                          <p>{text}</p>
                          <small>{time}</small>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">No recent messages found.</div>
                )}
              </div>
            </CardPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}
