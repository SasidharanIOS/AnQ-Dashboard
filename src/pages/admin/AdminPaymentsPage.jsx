import React, { useEffect, useMemo, useState } from "react";
import { CreditCard, Search } from "lucide-react";
import { adminAPI, formatDate, money, safeArray } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";

export default function AdminPaymentsPage() {
  const { showToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setPayments(safeArray(await adminAPI.payments()));
      } catch (error) {
        showToast(error.message || "Failed to load payments", "error");
        setPayments([]);
      }
    };

    loadPayments();
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();

    return payments.filter((payment) =>
      [
        payment.move?.job_id,
        payment.amount,
        payment.status,
        payment.payment_gateway,
        payment.stripe_payment_intent_id
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [payments, keyword]);

  return (
    <div className="module-page">
      <section className="card module-hero">
        <div className="stat-icon blue">
          <CreditCard size={25} />
        </div>

        <div>
          <h2>Payments</h2>
          <p>View Stripe deposits and payment confirmation records.</p>
        </div>

        <div className="module-search">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search payments..."
          />
          <Search size={17} />
        </div>
      </section>

      <section className="card module-table">
        <div className="panel-head">
          <h2>All Payments</h2>
        </div>

        <div className="table-scroll module-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Status</th>
                <th>Paid At</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <b>PAY-{payment.id}</b>
                  </td>

                  <td>{payment.move?.job_id || `ANQ-${payment.move_request_id}`}</td>
                  <td>{payment.customer?.full_name || `CUS-${payment.customer_id}`}</td>
                  <td>{payment.vendor?.company_name || payment.vendor_id || "—"}</td>
                  <td>{money(payment.amount)}</td>
                  <td>{payment.payment_gateway || "stripe"}</td>

                  <td>
                    <em className={`status-chip ${payment.status || "pending"}`}>
                      {payment.status || "pending"}
                    </em>
                  </td>

                  <td>{formatDate(payment.paid_at || payment.created_at)}</td>

                  <td>
                    <button className="tiny-btn" onClick={() => setSelectedPayment(payment)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length ? <div className="empty-state">No payment records found.</div> : null}
        </div>
      </section>

      <Modal open={!!selectedPayment} title="Payment Details" onClose={() => setSelectedPayment(null)} size="lg">
        <div className="details-clean-grid">
          <b>Payment ID</b>
          <span>PAY-{selectedPayment?.id}</span>

          <b>Job ID</b>
          <span>{selectedPayment?.move?.job_id || "—"}</span>

          <b>Customer</b>
          <span>{selectedPayment?.customer?.full_name || "—"}</span>

          <b>Vendor</b>
          <span>{selectedPayment?.vendor?.company_name || "—"}</span>

          <b>Amount</b>
          <span>{money(selectedPayment?.amount)}</span>

          <b>Currency</b>
          <span>{selectedPayment?.currency || "GBP"}</span>

          <b>Type</b>
          <span>{selectedPayment?.payment_type || "deposit"}</span>

          <b>Gateway</b>
          <span>{selectedPayment?.payment_gateway || "stripe"}</span>

          <b>Status</b>
          <span>{selectedPayment?.status || "pending"}</span>

          <b>Stripe Session</b>
          <span>{selectedPayment?.stripe_checkout_session_id || "—"}</span>

          <b>Stripe Intent</b>
          <span>{selectedPayment?.stripe_payment_intent_id || "—"}</span>
        </div>
      </Modal>
    </div>
  );
}