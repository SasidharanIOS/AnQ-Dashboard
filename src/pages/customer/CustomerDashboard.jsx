import React, { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Truck,
  WalletCards
} from "lucide-react";

import {
  dashboardAPI,
  formatDate,
  money,
  safeArray
} from "../../services/api.js";
import {
  CardPanel,
  StatCard,
  StatusPill
} from "../../components/ui/PortalUI.jsx";

const safeNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

const safeText = (value, fallback = "—") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const getRoute = (move) => {
  const from =
    move?.pickup_postcode ||
    move?.collection_postcode ||
    move?.from ||
    move?.pickup_address ||
    "From";

  const to =
    move?.delivery_postcode ||
    move?.destination_postcode ||
    move?.to ||
    move?.delivery_address ||
    "To";

  return `${from} → ${to}`;
};

const getCustomerDashboardStats = (data) => {
  const stats = data?.stats || data?.cards || data?.summary || {};
  const moves = data?.moves || data?.move_requests || {};
  const quotes = data?.quotes || data?.quote_summary || {};
  const payments = data?.payments || data?.payment_summary || {};

  return [
    {
      label: "Move Requests",
      value:
        stats.total_moves ||
        stats.move_requests ||
        moves.total ||
        data?.total_moves ||
        0,
      sub: "Total submitted",
      tone: "blue",
      icon: BriefcaseBusiness
    },
    {
      label: "Quotes Received",
      value:
        stats.quotes_received ||
        quotes.received ||
        quotes.total ||
        data?.quotes_received ||
        0,
      sub: "Vendor responses",
      tone: "navy",
      icon: FileText
    },
    {
      label: "Active Messages",
      value:
        stats.active_messages ||
        data?.active_messages ||
        data?.conversations_count ||
        0,
      sub: "Vendor chats",
      tone: "green",
      icon: MessageSquare
    },
    {
      label: "Deposits Paid",
      value: money(
        stats.deposits_paid ||
          payments.total_paid ||
          payments.total_deposits ||
          data?.deposits_paid ||
          0
      ),
      sub: "Stripe deposits",
      tone: "purple",
      icon: WalletCards
    }
  ];
};

const getCurrentMove = (data) => {
  const move =
    data?.current_move ||
    data?.latest_move ||
    data?.active_move ||
    data?.move ||
    safeArray(data?.moves)[0] ||
    safeArray(data?.move_requests)[0] ||
    null;

  if (!move) return null;

  return {
    id: move.id,
    job_id: move.job_id || `MOVE-${move.id}`,
    route: getRoute(move),
    moving_date:
      move.moving_date ||
      move.preferred_date_from ||
      move.date ||
      move.created_at,
    status: move.status || "pending",
    property:
      move.property_size ||
      move.property_type ||
      move.move_type ||
      "Move request",
    vendor:
      move.selected_vendor?.company_name ||
      move.vendor?.company_name ||
      move.assigned_vendor_name ||
      "Vendor not selected"
  };
};

const getRecentQuotes = (data) => {
  return safeArray(
    data?.recent_quotes ||
      data?.quotes?.items ||
      data?.quotes_list ||
      data?.quotes
  );
};

const getRecentActivity = (data) => {
  return safeArray(
    data?.recent_activity ||
      data?.activity ||
      data?.notifications ||
      data?.timeline
  );
};

function EmptyBlock({ title, message, icon: Icon = FileText }) {
  return (
    <div className="customer-dashboard-empty">
      <div className="customer-dashboard-empty-icon">
        <Icon size={26} />
      </div>

      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

export default function CustomerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let alive = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await dashboardAPI.get("customer");

        if (alive) {
          setDashboard(response || {});
        }
      } catch (error) {
        if (alive) {
          setDashboard({});
          setLoadError(error.message || "Failed to load customer dashboard");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      alive = false;
    };
  }, []);

  const data = dashboard || {};

  const stats = useMemo(() => {
    return getCustomerDashboardStats(data);
  }, [data]);

  const currentMove = useMemo(() => {
    return getCurrentMove(data);
  }, [data]);

  const quotes = useMemo(() => {
    return getRecentQuotes(data);
  }, [data]);

  const activity = useMemo(() => {
    return getRecentActivity(data);
  }, [data]);

  return (
    <div className="customer-dashboard-page">
      <style>
        {`
          .customer-dashboard-page {
            width: 100%;
            height: 100%;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0 8px 34px 0;
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .customer-dashboard-page::-webkit-scrollbar {
            width: 8px;
          }

          .customer-dashboard-page::-webkit-scrollbar-track {
            background: #f2f6fc;
            border-radius: 999px;
          }

          .customer-dashboard-page::-webkit-scrollbar-thumb {
            background: #c7d4e8;
            border-radius: 999px;
          }

          .customer-dashboard-page > * {
            flex: 0 0 auto;
            margin: 0;
          }

          .customer-dashboard-page .customer-trust-strip {
            display: grid;
            grid-template-columns: minmax(360px, 1fr) repeat(3, minmax(180px, 230px));
            gap: 14px;
            align-items: stretch;
          }

          .customer-dashboard-page .customer-hero-card,
          .customer-dashboard-page .customer-trust-mini {
            min-height: 112px;
            padding: 20px;
            border: 1px solid #dbe5f4;
            border-radius: 18px;
            background: #ffffff;
            box-shadow: 0 12px 34px rgba(7, 25, 79, 0.045);
            overflow: hidden;
          }

          .customer-dashboard-page .customer-hero-card {
            display: flex;
            align-items: center;
            gap: 16px;
            background:
              radial-gradient(circle at top left, rgba(0, 94, 255, 0.07), transparent 34%),
              linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
          }

          .customer-dashboard-page .customer-hero-icon {
            width: 56px;
            height: 56px;
            border-radius: 18px;
            background: #eef5ff;
            color: #005eff;
            display: grid;
            place-items: center;
            flex: 0 0 auto;
          }

          .customer-dashboard-page .customer-hero-card h2 {
            margin: 0 0 7px;
            color: #07194f;
            font-size: 24px;
            font-weight: 950;
            line-height: 1.1;
            letter-spacing: -0.03em;
          }

          .customer-dashboard-page .customer-hero-card p {
            margin: 0;
            color: #667297;
            font-size: 14px;
            font-weight: 750;
            line-height: 1.45;
          }

          .customer-dashboard-page .customer-trust-mini {
            display: flex;
            align-items: center;
            gap: 13px;
          }

          .customer-dashboard-page .customer-trust-mini svg {
            color: #07194f;
            flex: 0 0 auto;
          }

          .customer-dashboard-page .customer-trust-mini b {
            display: block;
            color: #07194f;
            font-size: 13px;
            font-weight: 950;
            line-height: 1.2;
          }

          .customer-dashboard-page .customer-trust-mini span {
            display: block;
            color: #667297;
            font-size: 11px;
            font-weight: 750;
            margin-top: 4px;
          }

          .customer-dashboard-page .customer-stat-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(170px, 1fr));
            gap: 14px;
          }

          .customer-dashboard-page .customer-content-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(330px, 0.8fr);
            gap: 18px;
            align-items: start;
            min-height: 0;
          }

          .customer-dashboard-page .customer-current-move {
            display: grid;
            grid-template-columns: 56px minmax(0, 1fr) auto;
            gap: 16px;
            align-items: center;
            padding: 18px;
            border: 1px solid #dbe5f4;
            border-radius: 18px;
            background: #ffffff;
          }

          .customer-dashboard-page .customer-current-move-icon {
            width: 56px;
            height: 56px;
            border-radius: 18px;
            background: #eef5ff;
            color: #005eff;
            display: grid;
            place-items: center;
          }

          .customer-dashboard-page .customer-current-move h3 {
            margin: 0;
            color: #07194f;
            font-size: 18px;
            font-weight: 950;
          }

          .customer-dashboard-page .customer-current-move p {
            margin: 6px 0 0;
            color: #667297;
            font-size: 13px;
            font-weight: 750;
          }

          .customer-dashboard-page .customer-current-meta {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 10px;
          }

          .customer-dashboard-page .customer-current-meta span {
            min-height: 28px;
            padding: 0 10px;
            border-radius: 999px;
            background: #f8fbff;
            border: 1px solid #dbe5f4;
            color: #667297;
            font-size: 12px;
            font-weight: 850;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .customer-dashboard-page .customer-quote-list,
          .customer-dashboard-page .customer-activity-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .customer-dashboard-page .customer-quote-item {
            padding: 15px;
            border: 1px solid #dbe5f4;
            border-radius: 16px;
            background: #ffffff;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 14px;
            align-items: center;
          }

          .customer-dashboard-page .customer-quote-item b {
            display: block;
            color: #07194f;
            font-size: 14px;
            font-weight: 950;
          }

          .customer-dashboard-page .customer-quote-item p {
            margin: 5px 0 0;
            color: #667297;
            font-size: 12px;
            font-weight: 750;
          }

          .customer-dashboard-page .customer-quote-price {
            text-align: right;
          }

          .customer-dashboard-page .customer-quote-price strong {
            display: block;
            color: #07194f;
            font-size: 20px;
            font-weight: 950;
          }

          .customer-dashboard-page .customer-activity-item {
            padding: 14px;
            border: 1px solid #dbe5f4;
            border-radius: 16px;
            background: #ffffff;
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }

          .customer-dashboard-page .customer-activity-dot {
            width: 30px;
            height: 30px;
            border-radius: 999px;
            background: #e9fff4;
            color: #07884e;
            display: grid;
            place-items: center;
            flex: 0 0 auto;
          }

          .customer-dashboard-page .customer-activity-item b {
            display: block;
            color: #07194f;
            font-size: 13px;
            font-weight: 950;
          }

          .customer-dashboard-page .customer-activity-item p {
            margin: 5px 0 0;
            color: #667297;
            font-size: 12px;
            font-weight: 750;
            line-height: 1.45;
          }

          .customer-dashboard-page .customer-dashboard-empty {
            min-height: 220px;
            padding: 30px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            text-align: center;
            border: 1px dashed #cbd8ec;
            border-radius: 18px;
            background: #f8fbff;
          }

          .customer-dashboard-page .customer-dashboard-empty-icon {
            width: 56px;
            height: 56px;
            border-radius: 18px;
            background: #eef5ff;
            color: #005eff;
            display: grid;
            place-items: center;
          }

          .customer-dashboard-page .customer-dashboard-empty h3 {
            margin: 0;
            color: #07194f;
            font-size: 17px;
            font-weight: 950;
          }

          .customer-dashboard-page .customer-dashboard-empty p {
            margin: 0;
            max-width: 380px;
            color: #667297;
            font-size: 13px;
            font-weight: 750;
            line-height: 1.5;
          }

          .customer-dashboard-page .customer-error-box {
            padding: 16px 18px;
            border: 1px solid #ffcdd1;
            border-radius: 18px;
            background: #fff0f1;
            color: #c4141d;
            font-size: 13px;
            font-weight: 850;
          }

          @media (max-width: 1280px) {
            .customer-dashboard-page .customer-trust-strip {
              grid-template-columns: 1fr 1fr;
            }

            .customer-dashboard-page .customer-stat-grid {
              grid-template-columns: repeat(2, minmax(170px, 1fr));
            }

            .customer-dashboard-page .customer-content-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 720px) {
            .customer-dashboard-page {
              padding-right: 4px;
            }

            .customer-dashboard-page .customer-trust-strip,
            .customer-dashboard-page .customer-stat-grid {
              grid-template-columns: 1fr;
            }

            .customer-dashboard-page .customer-current-move {
              grid-template-columns: 1fr;
            }

            .customer-dashboard-page .customer-quote-item {
              grid-template-columns: 1fr;
            }

            .customer-dashboard-page .customer-quote-price {
              text-align: left;
            }
          }
        `}
      </style>

      <section className="customer-trust-strip">
        <div className="customer-hero-card">
          <div className="customer-hero-icon">
            <Truck size={26} />
          </div>

          <div>
            <h2>Customer Dashboard</h2>
            <p>
              Track your move request, compare vendor quotes, chat with movers
              and manage your booking.
            </p>
          </div>
        </div>

        <div className="customer-trust-mini">
          <ShieldCheck size={27} />
          <div>
            <b>Verified Movers</b>
            <span>Trusted vendor network</span>
          </div>
        </div>

        <div className="customer-trust-mini">
          <MessageSquare size={27} />
          <div>
            <b>Private Messages</b>
            <span>Chat with vendors</span>
          </div>
        </div>

        <div className="customer-trust-mini">
          <WalletCards size={27} />
          <div>
            <b>Secure Deposit</b>
            <span>Stripe protected</span>
          </div>
        </div>
      </section>

      {loadError ? (
        <div className="customer-error-box">{loadError}</div>
      ) : null}

      {loading ? (
        <CardPanel title="Loading Dashboard" subtitle="Fetching live customer data.">
          <EmptyBlock
            icon={Clock}
            title="Loading..."
            message="Please wait while we load your dashboard."
          />
        </CardPanel>
      ) : (
        <>
          <div className="customer-stat-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  sub={stat.sub}
                  tone={stat.tone}
                  icon={Icon}
                />
              );
            })}
          </div>

          <div className="customer-content-grid">
            <CardPanel
              title="Current Move"
              subtitle="Your latest move request status."
            >
              {currentMove ? (
                <div className="customer-current-move">
                  <div className="customer-current-move-icon">
                    <MapPin size={24} />
                  </div>

                  <div>
                    <h3>{currentMove.job_id}</h3>
                    <p>{currentMove.route}</p>

                    <div className="customer-current-meta">
                      <span>
                        <CalendarDays size={14} />
                        {formatDate(currentMove.moving_date)}
                      </span>

                      <span>{currentMove.property}</span>

                      <StatusPill value={currentMove.status} />
                    </div>
                  </div>

                  <div>
                    <b>{currentMove.vendor}</b>
                  </div>
                </div>
              ) : (
                <EmptyBlock
                  icon={BriefcaseBusiness}
                  title="No move request yet"
                  message="Create your move request to start receiving quotes from verified movers."
                />
              )}
            </CardPanel>

            <CardPanel title="Recent Activity" subtitle="Latest updates.">
              <div className="customer-activity-list">
                {activity.length ? (
                  activity.slice(0, 6).map((item, index) => (
                    <div
                      className="customer-activity-item"
                      key={item.id || index}
                    >
                      <div className="customer-activity-dot">
                        <CheckCircle2 size={15} />
                      </div>

                      <div>
                        <b>
                          {item.title ||
                            item.action ||
                            item.type ||
                            "Activity update"}
                        </b>

                        <p>
                          {item.message ||
                            item.description ||
                            formatDate(item.created_at) ||
                            "New update received."}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyBlock
                    icon={Clock}
                    title="No activity yet"
                    message="Your job activity and notifications will appear here."
                  />
                )}
              </div>
            </CardPanel>

            <CardPanel
              title="Recent Quotes"
              subtitle="Latest vendor quotes for your move."
            >
              <div className="customer-quote-list">
                {quotes.length ? (
                  quotes.slice(0, 6).map((quote) => (
                    <div className="customer-quote-item" key={quote.id}>
                      <div>
                        <b>
                          {quote.vendor?.company_name ||
                            quote.vendor_name ||
                            `Vendor ${quote.vendor_id || ""}`}
                        </b>

                        <p>
                          {quote.move?.job_id ||
                            quote.job_id ||
                            `MOVE-${quote.move_request_id || "—"}`}
                        </p>

                        <StatusPill value={quote.status || "submitted"} />
                      </div>

                      <div className="customer-quote-price">
                        <strong>
                          {money(
                            quote.quote_amount ||
                              quote.amount ||
                              quote.total_amount ||
                              0
                          )}
                        </strong>

                        <p>{formatDate(quote.created_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyBlock
                    icon={FileText}
                    title="No quotes received"
                    message="Vendor quotes will appear here once assigned movers submit pricing."
                  />
                )}
              </div>
            </CardPanel>
          </div>
        </>
      )}
    </div>
  );
}