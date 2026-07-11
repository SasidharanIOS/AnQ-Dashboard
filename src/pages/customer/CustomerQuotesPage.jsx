import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { customerAPI, money, safeArray } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { CardPanel, DetailsGrid, PageHeader, StatusPill } from "../../components/ui/PortalUI.jsx";

export default function CustomerQuotesPage() {
  const { showToast } = useToast();
  const [moves, setMoves] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async () => { try { const m = safeArray(await customerAPI.moves()); setMoves(m); const first = m[0]; setQuotes(first ? safeArray(await customerAPI.quotes(first.id)) : []); } catch (e) { showToast(e.message, "error"); } };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => quotes.filter((q) => [q.vendor?.company_name, q.quote_amount, q.status, q.insurance_summary].filter(Boolean).join(" ").toLowerCase().includes(keyword.toLowerCase())), [quotes, keyword]);
  const selectAndPay = async (quote) => { try { await customerAPI.selectQuote(quote.id); const session = await customerAPI.createDepositSession({ quote_id: quote.id, move_request_id: quote.move_request_id, success_url: window.location.href, cancel_url: window.location.href }); if (session?.checkout_url) window.open(session.checkout_url, "_blank"); showToast("Quote selected"); await load(); } catch (e) { showToast(e.message, "error"); } };

  return (
    <div className="page-wrap">
      <PageHeader icon={ShieldCheck} title="Quotes Received / Compare Quotes" subtitle="Compare verified movers and lock in your preferred mover." search={keyword} onSearch={setKeyword} placeholder="Search quotes..." />
      <CardPanel title="Compare Quotes" subtitle="All prices include VAT. No hidden fees.">
        <div className="quote-list">
          {filtered.map((quote, index) => (
            <article className="quote-card" key={quote.id}>
              <div className="quote-vendor"><div className="vendor-badge">{(quote.vendor?.company_name || "M").slice(0, 1)}</div><div><div className="quote-title"><b>{quote.vendor?.company_name || "Verified Mover"}</b><em className="pill green">Verified</em></div><p className="stars-line">★ ★ ★ ★ ★ <span>{quote.vendor?.rating || "4.8"} ({quote.vendor?.total_reviews || 0} reviews)</span></p><p className="quote-meta"><ShieldCheck size={13} /> {quote.vendor?.verification_status || "verified"}</p></div></div>
              <div className="quote-price"><span>Your Quote</span><b>{money(quote.quote_amount)}</b><small>Inc. VAT</small></div>
              <div className="quote-includes"><span>Includes</span><p><CheckCircle2 size={13} /> {quote.insurance_summary || "Goods in Transit Insurance"}</p><p><CheckCircle2 size={13} /> Public Liability Insurance</p><p><CheckCircle2 size={13} /> Fully Equipped Van</p><p><CheckCircle2 size={13} /> {quote.number_of_movers || 2} Professional Movers</p></div>
              <div className="quote-actions"><span>Available from</span><b><CalendarDays size={13} /> {quote.availability_from || "Flexible"}</b><button className={index === 0 ? "red-btn" : "outline-btn"} onClick={() => selectAndPay(quote)}>{index === 0 ? "Book & Pay Deposit" : "Select This Mover"}</button><button className="outline-btn" onClick={() => setSelected(quote)}>View Details</button></div>
            </article>
          ))}
          {!filtered.length ? <div className="empty-state">{moves.length ? "No quotes received yet." : "Create a move first."}</div> : null}
        </div>
      </CardPanel>
      <Modal open={!!selected} title="Quote Details" onClose={() => setSelected(null)} size="lg"><DetailsGrid rows={[["Vendor", selected?.vendor?.company_name], ["Amount", money(selected?.quote_amount)], ["Availability From", selected?.availability_from], ["Availability To", selected?.availability_to], ["Insurance", selected?.insurance_summary], ["Goods in Transit", selected?.goods_in_transit_cover], ["Public Liability", selected?.public_liability_cover], ["Movers", selected?.number_of_movers], ["Van Details", selected?.van_details], ["Status", selected?.status], ["Notes", selected?.additional_notes]]} /><div className="modal-actions"><button className="outline-btn" onClick={() => setSelected(null)}>Close</button><button className="red-btn" onClick={() => selectAndPay(selected)}>Select & Pay Deposit</button></div></Modal>
    </div>
  );
}
