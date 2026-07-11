import { customerDashboard, vendorDashboard, adminDashboard } from "../data/mockData.js";
import { formatDate, money, safeArray } from "../services/api.js";

export const routeLabel = (from, to) => `${from || "—"} → ${to || "—"}`;
export const moveTypeLabel = (type) => String(type || "house_move").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function mapCustomerDashboard(apiData) {
  if (!apiData?.active_move) return customerDashboard;
  const move = apiData.active_move;
  const quotes = safeArray(apiData.quotes).map((q, index) => ({
    id: q.id,
    move_request_id: q.move_request_id,
    vendor_id: q.vendor_id,
    vendor: q.vendor?.company_name || "Verified Mover",
    logo: (q.vendor?.company_name || "M").slice(0, 1).toUpperCase(),
    rating: Number(q.vendor?.rating || 4.8).toFixed(1),
    reviews: q.vendor?.total_reviews || 0,
    member: q.vendor?.verification_status === "verified" ? "Verified on AnQ Movers" : "Member of BAR",
    exp: `${q.vendor?.years_experience || 3}+ years on AnQ Movers`,
    amount: money(q.quote_amount),
    rawAmount: q.quote_amount,
    availability: formatDate(q.availability_from),
    movers: `${q.number_of_movers || 2} Professional Movers`,
    notes: q.additional_notes,
    primary: index === 0,
  }));
  return {
    activeMove: {
      id: move.id,
      jobId: move.job_id,
      status: move.status === "quotes_received" ? "Awaiting Your Decision" : move.status?.replaceAll("_", " ") || "Profile Pending",
      moveType: moveTypeLabel(move.move_type),
      from: move.pickup_postcode || move.pickup_address,
      to: move.delivery_postcode || move.delivery_address,
      date: formatDate(move.moving_date),
      note: apiData.quote_count ? `You have ${apiData.quote_count} verified quotes. Choose the best fit for your move.` : "Complete your profile to receive accurate quotes.",
      progress: apiData.move_progress || move.profile_completion_percent || 0,
      selected_quote_id: move.selected_quote_id,
      deposit_paid: move.deposit_paid,
    },
    stats: [
      { label: "New Messages", value: String(apiData.unread_message_count || 0), link: "View messages", tone: "red", action: "messages" },
      { label: "Quotes Received", value: String(apiData.quote_count || 0), link: "View quotes", tone: "blue", action: "quotes" },
      { label: "Deposit to Book", value: money(apiData.deposit_amount || 50), link: "How it works", tone: "navy", action: "deposit" },
    ],
    quotes: quotes.length ? quotes : customerDashboard.quotes,
    messages: safeArray(apiData.recent_messages).map((m) => ({ name: m.vendor?.company_name || "Mover", logo: (m.vendor?.company_name || "M").slice(0,1), text: m.message || "New message", time: formatDate(m.created_at), unread: m.is_read ? 0 : 1, conversation_id: m.conversation_id })),
    nextSteps: safeArray(apiData.next_steps).map((s) => ({ title: s.title, desc: s.note, done: s.completed, current: s.current })),
  };
}

export function mapVendorDashboard(apiData) {
  if (!apiData?.counts) return vendorDashboard;
  const h = apiData.highlighted_lead;
  const move = h?.move || {};
  return {
    stats: [
      { label: "New Leads", value: apiData.counts.new_leads || 0, sub: "+ from assigned enquiries", icon: "users", tone: "blue", link: "View new leads" },
      { label: "Quotes Submitted", value: apiData.counts.quotes_submitted || 0, sub: "+ active quotes", icon: "clipboard", tone: "blue", link: "View all quotes" },
      { label: "Won Jobs", value: apiData.counts.won_jobs || 0, sub: "+ confirmed jobs", icon: "shield", tone: "green", link: "View won jobs" },
      { label: "Pending Actions", value: apiData.counts.pending_actions || 0, sub: "Requires your attention", icon: "alert", tone: "red", link: "View pending" },
    ],
    lead: h ? {
      id: move.id,
      jobId: move.job_id,
      status: h.assignment?.status?.replaceAll("_", " ") || "New Lead",
      from: move.pickup_postcode,
      to: move.delivery_postcode,
      date: formatDate(move.moving_date),
      preferred: `${formatDate(move.preferred_date_from)} - ${formatDate(move.preferred_date_to)}`,
      property: move.property_size || move.property_type || "House Move",
      size: move.property_type || "Move profile available",
      match: move.profile_completion_percent || 85,
    } : vendorDashboard.lead,
    enquiries: safeArray(apiData.assigned_enquiries).map((r) => ({
      id: r.move?.id,
      jobId: r.move?.job_id,
      status: r.assignment?.status?.replaceAll("_", " ") || "Assigned",
      from: r.move?.pickup_postcode,
      to: r.move?.delivery_postcode,
      date: formatDate(r.move?.moving_date),
      property: r.move?.property_size || r.move?.property_type,
      size: r.move?.property_type || "—",
      match: r.move?.profile_completion_percent || 70,
      quote: r.quote,
    })).filter((x) => x.jobId),
    messages: safeArray(apiData.recent_messages).map((m) => ({ name: m.move?.job_id || "Customer", logo: "AN", text: m.message || "New message", time: formatDate(m.created_at), unread: m.is_read ? 0 : 1, move_id: m.move?.id })),
    jobs: safeArray(apiData.upcoming_jobs).map((j) => ({ jobId: j.job_id, status: j.status?.replaceAll("_", " "), date: formatDate(j.moving_date), route: routeLabel(j.pickup_postcode, j.delivery_postcode) })),
  };
}

export function mapAdminDashboard(apiData) {
  if (!apiData?.cards) return adminDashboard;
  return {
    stats: [
      { label: "Total Active Jobs", value: Number(apiData.cards.total_active_jobs || 0).toLocaleString(), change: "Live", tone: "blue", icon: "calendar" },
      { label: "In-Progress Jobs", value: Number(apiData.cards.in_progress_jobs || 0).toLocaleString(), change: "Live", tone: "orange", icon: "hourglass" },
      { label: "Completed Jobs", value: Number(apiData.cards.completed_jobs || 0).toLocaleString(), change: "Live", tone: "green", icon: "check" },
      { label: "Total Deposits", value: money(apiData.cards.total_deposits || 0), change: "Live", tone: "purple", icon: "pound" },
    ],
    jobs: safeArray(apiData.job_management).map((j) => ({
      id: j.id,
      jobId: j.job_id,
      customer: j.customer?.full_name || "Customer",
      customerId: `CUS-${j.customer?.id || j.customer_id}`,
      phone: j.customer?.mobile || "Hidden",
      moveType: moveTypeLabel(j.move_type),
      size: j.property_size || j.property_type || "—",
      route: routeLabel(j.pickup_postcode, j.delivery_postcode),
      date: formatDate(j.moving_date),
      status: j.status?.replaceAll("_", " "),
      vendor: j.assigned_vendor?.company_name,
      rating: j.assigned_vendor?.rating,
    })),
    assignments: safeArray(apiData.vendor_assignments).map((j) => ({ id: j.id, jobId: j.job_id, route: routeLabel(j.pickup_postcode, j.delivery_postcode), date: formatDate(j.moving_date) })),
    status: [
      { label: "Active", count: apiData.customer_vendor_status?.customers?.active || 0, change: "live", tone: "green" },
      { label: "Suspended", count: apiData.customer_vendor_status?.customers?.suspended || 0, change: "live", tone: "red", down: true },
      { label: "Vendor Active", count: apiData.customer_vendor_status?.vendors?.active || 0, change: "live", tone: "green" },
      { label: "Vendor Pending", count: apiData.customer_vendor_status?.vendors?.pending || 0, change: "live", tone: "orange" },
    ],
    activity: safeArray(apiData.recent_activity).map((a) => `${a.action || "Activity"} in ${a.module || "system"}`),
    raw: apiData,
  };
}
