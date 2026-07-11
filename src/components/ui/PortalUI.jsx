import React from "react";
import { Search } from "lucide-react";

const clean = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).replaceAll("_", " ");
};

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  search,
  onSearch,
  placeholder = "Search...",
  action
}) {
  const hasSearch = typeof onSearch === "function";

  return (
    <section className="portal-page-header">
      <div className="portal-page-header-left">
        <div className="portal-page-icon">
          {Icon ? <Icon size={25} /> : null}
        </div>

        <div className="portal-page-title-block">
          <span className="portal-page-kicker">AnQ Movers Portal</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="portal-page-header-right">
        {hasSearch ? (
          <div className="portal-search-box">
            <Search size={18} />
            <input
              value={search || ""}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={placeholder}
            />
          </div>
        ) : null}

        {action ? <div className="portal-header-action">{action}</div> : null}
      </div>
    </section>
  );
}

export function CardPanel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`portal-card-panel ${className}`}>
      {(title || subtitle || action) ? (
        <div className="portal-card-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          {action ? <div className="portal-card-action">{action}</div> : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}

export function StatusPill({ value }) {
  const status = String(value || "pending").toLowerCase();

  return (
    <em className={`status-chip ${status.replaceAll("_", "-")}`}>
      {clean(status)}
    </em>
  );
}

export function DetailsGrid({ rows = [] }) {
  return (
    <div className="details-clean-grid">
      {rows.map(([label, value]) => (
        <React.Fragment key={label}>
          <b>{label}</b>
          <span>{clean(value)}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, tone = "blue" }) {
  return (
    <div className={`portal-stat-card ${tone}`}>
      <div className="portal-stat-icon">
        {Icon ? <Icon size={20} /> : null}
      </div>

      <div>
        <span>{label}</span>
        <b>{value}</b>
        {sub ? <p>{sub}</p> : null}
      </div>
    </div>
  );
}