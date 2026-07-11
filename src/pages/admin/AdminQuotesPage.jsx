import React, { useEffect, useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { adminAPI, formatDate, money, safeArray } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";

export default function AdminQuotesPage() {
  const { showToast } = useToast();

  const [quotes, setQuotes] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setQuotes(safeArray(await adminAPI.quotes()));
      } catch (error) {
        showToast(error.message || "Failed to load quotes", "error");
        setQuotes([]);
      }
    };

    loadQuotes();
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();

    return quotes.filter((quote) =>
      [
        quote.move?.job_id,
        quote.vendor?.company_name,
        quote.quote_amount,
        quote.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [quotes, keyword]);

  return (
    <div className="module-page">
      <section className="card module-hero">
        <div className="stat-icon blue">
          <FileText size={25} />
        </div>

        <div>
          <h2>Quotes</h2>
          <p>View all vendor quotes submitted across the platform.</p>
        </div>

        <div className="module-search">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search quotes..."
          />
          <Search size={17} />
        </div>
      </section>

      <section className="card module-table">
        <div className="panel-head">
          <h2>All Quotes</h2>
        </div>

        <div className="table-scroll module-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Quote ID</th>
                <th>Job ID</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((quote) => (
                <tr key={quote.id}>
                  <td>
                    <b>QUOTE-{quote.id}</b>
                  </td>

                  <td>{quote.move?.job_id || `ANQ-${quote.move_request_id}`}</td>
                  <td>{quote.vendor?.company_name || `VEN-${quote.vendor_id}`}</td>
                  <td>{money(quote.quote_amount)}</td>

                  <td>
                    <em className={`status-chip ${String(quote.status).replaceAll("_", "-")}`}>
                      {String(quote.status || "submitted").replaceAll("_", " ")}
                    </em>
                  </td>

                  <td>{formatDate(quote.submitted_at || quote.created_at)}</td>

                  <td>
                    <button className="tiny-btn" onClick={() => setSelectedQuote(quote)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length ? <div className="empty-state">No quotes found.</div> : null}
        </div>
      </section>

      <Modal open={!!selectedQuote} title="Quote Details" onClose={() => setSelectedQuote(null)} size="lg">
        <div className="details-clean-grid">
          <b>Quote ID</b>
          <span>QUOTE-{selectedQuote?.id}</span>

          <b>Job ID</b>
          <span>{selectedQuote?.move?.job_id || "—"}</span>

          <b>Vendor</b>
          <span>{selectedQuote?.vendor?.company_name || "—"}</span>

          <b>Amount</b>
          <span>{money(selectedQuote?.quote_amount)}</span>

          <b>Insurance</b>
          <span>{selectedQuote?.insurance_summary || "—"}</span>

          <b>Status</b>
          <span>{String(selectedQuote?.status || "submitted").replaceAll("_", " ")}</span>

          <b>Notes</b>
          <span>{selectedQuote?.additional_notes || "—"}</span>
        </div>
      </Modal>
    </div>
  );
}