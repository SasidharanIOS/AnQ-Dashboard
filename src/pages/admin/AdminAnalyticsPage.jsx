import React, { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Clock, FileText, WalletCards } from "lucide-react";
import { adminAPI, money } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";

export default function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setAnalytics(await adminAPI.analytics());
      } catch (error) {
        showToast(error.message || "Failed to load analytics", "error");
      }
    };

    loadAnalytics();
  }, []);

  const cards = [
    {
      label: "Total Jobs",
      value: analytics?.total_jobs || analytics?.jobs?.total || 0,
      icon: FileText
    },
    {
      label: "In Progress",
      value: analytics?.in_progress_jobs || analytics?.jobs?.in_progress || 0,
      icon: Clock
    },
    {
      label: "Completed Jobs",
      value: analytics?.completed_jobs || analytics?.jobs?.completed || 0,
      icon: CheckCircle2
    },
    {
      label: "Total Deposits",
      value: money(analytics?.total_deposits || analytics?.payments?.total || 0),
      icon: WalletCards
    }
  ];

  return (
    <div className="module-page">
      <section className="card module-hero">
        <div className="stat-icon blue">
          <BarChart3 size={25} />
        </div>

        <div>
          <h2>Analytics</h2>
          <p>Track jobs, deposits, vendor activity and platform performance.</p>
        </div>
      </section>

      <div className="module-stats">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="card" key={card.label}>
              <span>{card.label}</span>
              <b>{card.value}</b>
              <p>
                <Icon size={14} /> Live metric
              </p>
            </div>
          );
        })}
      </div>

      <section className="card module-table">
        <div className="panel-head">
          <h2>Analytics Summary</h2>
        </div>

        <div className="details-clean-grid">
          <b>Total Jobs</b>
          <span>{cards[0].value}</span>

          <b>In Progress Jobs</b>
          <span>{cards[1].value}</span>

          <b>Completed Jobs</b>
          <span>{cards[2].value}</span>

          <b>Total Deposits</b>
          <span>{cards[3].value}</span>

          <b>Quote Conversion</b>
          <span>{analytics?.quote_conversion_rate || "—"}</span>

          <b>Vendor Count</b>
          <span>{analytics?.total_vendors || analytics?.vendors?.total || 0}</span>

          <b>Customer Count</b>
          <span>{analytics?.total_customers || analytics?.customers?.total || 0}</span>
        </div>
      </section>
    </div>
  );
}