import React, { useEffect, useMemo, useState } from "react";
import { CreditCard, LockKeyhole, Search, WalletCards } from "lucide-react";
import { customerAPI, formatDate, money, safeArray } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { CardPanel, DetailsGrid, PageHeader, StatCard, StatusPill } from "../../components/ui/PortalUI.jsx";

export default function CustomerPaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(null);
  const load = async () => { try { setPayments(safeArray(await customerAPI.payments())); } catch (e) { showToast(e.message, "error"); } };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => payments.filter((p) => [p.move?.job_id, p.status, p.payment_gateway, p.amount].filter(Boolean).join(" ").toLowerCase().includes(keyword.toLowerCase())), [payments, keyword]);
  const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  return <div className="page-wrap"><PageHeader icon={WalletCards} title="Payments / £50 Lock-in Deposit" subtitle="Secure your booking with the £50 lock-in deposit." search={keyword} onSearch={setKeyword} placeholder="Search payments..." /><div className="stat-grid"><StatCard label="Deposit Amount" value="£50" sub="Lock-in deposit" icon={LockKeyhole} tone="navy" /><StatCard label="Total Paid" value={money(total)} sub="All payments" icon={WalletCards} tone="green" /><StatCard label="Transactions" value={payments.length} sub="Real backend" icon={CreditCard} tone="blue" /><StatCard label="Secure Payment" value="Stripe" sub="Protected checkout" icon={LockKeyhole} tone="purple" /></div><CardPanel title="Payment History" subtitle="Track Stripe deposit payments and confirmations."><div className="table-scroll"><table><thead><tr><th>Payment ID</th><th>Job ID</th><th>Amount</th><th>Type</th><th>Gateway</th><th>Status</th><th>Paid At</th><th>Actions</th></tr></thead><tbody>{filtered.map((p) => <tr key={p.id}><td><b>PAY-{p.id}</b></td><td>{p.move?.job_id || `ANQ-${p.move_request_id || "—"}`}</td><td>{money(p.amount)}</td><td>{p.payment_type || "deposit"}</td><td>{p.payment_gateway || "stripe"}</td><td><StatusPill value={p.status} /></td><td>{formatDate(p.paid_at || p.created_at)}</td><td><button className="tiny-btn" onClick={() => setSelected(p)}>View</button></td></tr>)}</tbody></table>{!filtered.length ? <div className="empty-state">No payment records found.</div> : null}</div></CardPanel><Modal open={!!selected} title="Payment Details" onClose={() => setSelected(null)} size="lg"><DetailsGrid rows={[["Payment ID", `PAY-${selected?.id || ""}`], ["Job ID", selected?.move?.job_id], ["Amount", money(selected?.amount)], ["Currency", selected?.currency || "GBP"], ["Payment Type", selected?.payment_type], ["Gateway", selected?.payment_gateway], ["Status", selected?.status], ["Stripe Session", selected?.stripe_checkout_session_id], ["Stripe Intent", selected?.stripe_payment_intent_id]]} /></Modal></div>;
}
