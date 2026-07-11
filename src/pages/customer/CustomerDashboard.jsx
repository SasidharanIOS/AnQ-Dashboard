import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Headphones,
  LockKeyhole,
  MessageSquare,
  ShieldCheck,
  Truck,
  WalletCards
} from "lucide-react";

import { customerDashboard as fallback } from "../../data/mockData.js";
import { dashboardAPI } from "../../services/api.js";
import { mapCustomerDashboard } from "../../utils/mappers.js";
import { useAsyncData } from "../../hooks/useAsyncData.js";
import { CardPanel, StatCard } from "../../components/ui/PortalUI.jsx";

function getStatIcon(action) {
  if (action === "messages") return MessageSquare;
  if (action === "quotes") return CheckCircle2;
  if (action === "payments") return WalletCards;
  return Truck;
}

function QuoteCard({ quote, onSelect }) {
  return (
    <article className="quote-card">
      <div className="quote-vendor">
        <div className="vendor-badge">{quote.logo || "M"}</div>

        <div>
          <div className="quote-title">
            <b>{quote.vendor}</b>
            <em className="pill green">Verified</em>
          </div>

          <p className="stars-line">
            ★ ★ ★ ★ ★{" "}
            <span>
              {quote.rating} ({quote.reviews} reviews)
            </span>
          </p>

          <p className="quote-meta">
            <ShieldCheck size={13} /> {quote.member}
          </p>

          <p className="quote-meta">
            <Truck size={13} /> {quote.exp}
          </p>
        </div>
      </div>

      <div className="quote-price">
        <span>Your Quote</span>
        <b>{quote.amount}</b>
        <small>Inc. VAT</small>
      </div>

      <div className="quote-includes">
        <span>Includes</span>
        <p>
          <CheckCircle2 size={13} /> Goods in Transit Insurance
        </p>
        <p>
          <CheckCircle2 size={13} /> Public Liability Insurance
        </p>
        <p>
          <CheckCircle2 size={13} /> Fully Equipped Van
        </p>
        <p>
          <CheckCircle2 size={13} /> {quote.movers}
        </p>
      </div>

      <div className="quote-actions">
        <span>Available from</span>

        <b>
          <CalendarDays size={13} /> {quote.availability}
        </b>

        <button
          className={quote.primary ? "red-btn" : "outline-btn"}
          onClick={() => onSelect(quote)}
        >
          {quote.primary ? "Book & Pay Deposit" : "Select This Mover"}
        </button>

        <button className="outline-btn">Chat with Mover</button>
      </div>
    </article>
  );
}

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const { data: apiData } = useAsyncData(
    () => dashboardAPI.get("customer"),
    [],
    null
  );

  const data = useMemo(() => mapCustomerDashboard(apiData), [apiData]);

  const move = data?.activeMove || fallback.activeMove;
  const stats = data?.stats?.length ? data.stats : fallback.stats;
  const quotes = data?.quotes?.length ? data.quotes : fallback.quotes;
  const nextSteps = data?.nextSteps?.length
    ? data.nextSteps
    : fallback.nextSteps;

  return (
    <div className="dash-page customer-page customer-dashboard-scroll-page">
      <style>
        {`
          .customer-dashboard-scroll-page {
            width: 100%;
            height: calc(100vh - 92px);
            max-height: calc(100vh - 92px);
            min-height: 0;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            padding: 0 8px 34px 0;
            scroll-behavior: smooth;
            overscroll-behavior: contain;
          }

          .customer-dashboard-scroll-page::-webkit-scrollbar {
            width: 8px;
          }

          .customer-dashboard-scroll-page::-webkit-scrollbar-track {
            background: #f2f6fc;
            border-radius: 999px;
          }

          .customer-dashboard-scroll-page::-webkit-scrollbar-thumb {
            background: #c7d4e8;
            border-radius: 999px;
          }

          .customer-dashboard-scroll-inner {
            width: 100%;
            min-height: max-content;
            display: flex;
            flex-direction: column;
            gap: 18px;
            padding-bottom: 30px;
          }

          .customer-dashboard-scroll-page .trust-strip,
          .customer-dashboard-scroll-page .stat-grid,
          .customer-dashboard-scroll-page .content-grid-2 {
            flex: 0 0 auto;
            margin: 0;
          }

          .customer-dashboard-scroll-page .trust-strip {
            display: grid;
            grid-template-columns: minmax(360px, 1fr) repeat(3, minmax(190px, 240px));
            gap: 14px;
            align-items: stretch;
          }

          .customer-dashboard-scroll-page .hero-card {
            min-height: 112px;
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 20px;
            border-radius: 18px;
            overflow: hidden;
          }

          .customer-dashboard-scroll-page .hero-card h2 {
            margin: 0;
            color: #07194f;
            font-size: 24px;
            font-weight: 950;
            letter-spacing: -0.03em;
          }

          .customer-dashboard-scroll-page .hero-card p {
            margin: 7px 0 0;
            color: #667297;
            font-size: 13px;
            font-weight: 750;
            line-height: 1.45;
          }

          .customer-dashboard-scroll-page .hero-icon {
            width: 56px;
            height: 56px;
            border-radius: 17px;
            display: grid;
            place-items: center;
            background: #eef5ff;
            color: #005eff;
            flex: 0 0 auto;
          }

          .customer-dashboard-scroll-page .trust-mini {
            min-height: 112px;
            display: flex;
            align-items: center;
            gap: 13px;
            padding: 18px;
            border-radius: 18px;
          }

          .customer-dashboard-scroll-page .trust-mini svg {
            color: #07194f;
            flex: 0 0 auto;
          }

          .customer-dashboard-scroll-page .trust-mini b {
            display: block;
            color: #07194f;
            font-size: 13px;
            font-weight: 950;
            line-height: 1.25;
          }

          .customer-dashboard-scroll-page .trust-mini span {
            display: block;
            color: #667297;
            font-size: 12px;
            font-weight: 750;
            line-height: 1.35;
            margin-top: 4px;
          }

          .customer-dashboard-scroll-page .stat-grid {
            display: grid;
            grid-template-columns: minmax(320px, 1.2fr) repeat(3, minmax(180px, 1fr));
            gap: 14px;
            align-items: stretch;
          }

          .customer-dashboard-scroll-page .move-card {
            min-height: 116px;
            padding: 20px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
          }

          .customer-dashboard-scroll-page .move-card h3 {
            margin: 0;
            color: #07194f;
            font-size: 22px;
            font-weight: 950;
          }

          .customer-dashboard-scroll-page .move-card p {
            margin: 7px 0 14px;
            color: #667297;
            font-size: 13px;
            font-weight: 750;
          }

          .customer-dashboard-scroll-page .progress-track {
            width: 100%;
            max-width: 360px;
            height: 9px;
            border-radius: 999px;
            background: #e6edf7;
            overflow: hidden;
          }

          .customer-dashboard-scroll-page .progress-track i {
            display: block;
            height: 100%;
            border-radius: 999px;
            background: #0aae68;
          }

          .customer-dashboard-scroll-page .content-grid-2 {
            display: grid;
            grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
            gap: 18px;
            align-items: start;
          }

          .customer-dashboard-scroll-page .quote-list {
            max-height: none !important;
            overflow: visible !important;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .customer-dashboard-scroll-page .quote-card {
            min-width: 0;
          }

          .customer-dashboard-scroll-page .progress-list {
            max-height: none;
            overflow: visible;
          }

          @media (max-width: 1280px) {
            .customer-dashboard-scroll-page {
              height: calc(100vh - 76px);
              max-height: calc(100vh - 76px);
            }

            .customer-dashboard-scroll-page .trust-strip {
              grid-template-columns: 1fr 1fr;
            }

            .customer-dashboard-scroll-page .stat-grid {
              grid-template-columns: 1fr 1fr;
            }

            .customer-dashboard-scroll-page .content-grid-2 {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 720px) {
            .customer-dashboard-scroll-page {
              height: calc(100vh - 68px);
              max-height: calc(100vh - 68px);
              padding-right: 4px;
            }

            .customer-dashboard-scroll-page .trust-strip,
            .customer-dashboard-scroll-page .stat-grid,
            .customer-dashboard-scroll-page .content-grid-2 {
              grid-template-columns: 1fr;
            }

            .customer-dashboard-scroll-page .move-card {
              flex-direction: column;
              align-items: flex-start;
            }

            .customer-dashboard-scroll-page .hero-card,
            .customer-dashboard-scroll-page .trust-mini {
              min-height: auto;
            }
          }
        `}
      </style>

      <div className="customer-dashboard-scroll-inner">
        <section className="trust-strip">
          <div className="card hero-card">
            <div className="hero-icon">
              <Truck size={25} />
            </div>

            <div>
              <h2>AnQ Movers Customer Portal</h2>
              <p>
                Complete customer journey from move request to confirmed
                booking.
              </p>
            </div>
          </div>

          <div className="card trust-mini">
            <ShieldCheck size={27} />
            <div>
              <b>Secure & Verified</b>
              <span>All movers verified</span>
            </div>
          </div>

          <div className="card trust-mini">
            <LockKeyhole size={27} />
            <div>
              <b>Secure Payments</b>
              <span>Powered by Stripe</span>
            </div>
          </div>

          <div className="card trust-mini">
            <Headphones size={27} />
            <div>
              <b>24/7 Support</b>
              <span>We are here to help</span>
            </div>
          </div>
        </section>

        <section className="stat-grid">
          <div className="card move-card">
            <div>
              <h3>{move.jobId}</h3>
              <p>
                {move.moveType} • {move.from} → {move.to}
              </p>

              <div className="progress-track">
                <i style={{ width: `${move.progress || 0}%` }} />
              </div>
            </div>

            <em className="status-chip quotes-received">{move.status}</em>
          </div>

          {stats.map((stat) => {
            const Icon = getStatIcon(stat.action);

            return (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                sub={stat.link}
                tone={stat.tone}
                icon={Icon}
              />
            );
          })}
        </section>

        <div className="content-grid-2">
          <CardPanel
            title="Compare Quotes"
            subtitle="All quotes are verified and competitive"
            action={
              <button
                className="outline-btn"
                onClick={() => navigate("/customer/quotes")}
              >
                View all quotes
              </button>
            }
          >
            <div className="quote-list">
              {quotes.map((quote) => (
                <QuoteCard
                  key={`${quote.vendor}-${quote.amount}`}
                  quote={quote}
                  onSelect={() => navigate("/customer/payments")}
                />
              ))}
            </div>
          </CardPanel>

          <CardPanel title="Next Steps" subtitle="Your move progress">
            <div className="progress-list">
              {nextSteps.map((step, index) => (
                <div className="step-row" key={step.title}>
                  <div className={`step-dot ${step.done ? "done" : ""}`}>
                    {step.done ? <Check size={14} /> : index + 1}
                  </div>

                  <div>
                    <b>{step.title}</b>
                    {step.date ? <span>{step.date}</span> : null}
                    {step.desc ? <p>{step.desc}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </CardPanel>
        </div>
      </div>
    </div>
  );
}