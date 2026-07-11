import React, { useEffect, useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { adminAPI, formatDate, safeArray } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";

export default function AdminCustomersPage() {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const loadCustomers = async () => {
    try {
      setCustomers(safeArray(await adminAPI.customers({ limit: 50 })));
    } catch (error) {
      showToast(error.message || "Failed to load customers", "error");
      setCustomers([]);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();

    return customers.filter((customer) =>
      [customer.full_name, customer.email, customer.mobile, customer.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [customers, keyword]);

  const suspendCustomer = async (customer) => {
    try {
      await adminAPI.updateCustomerStatus(customer.id, "suspended");
      showToast("Customer suspended");
      loadCustomers();
    } catch (error) {
      showToast(error.message || "Failed to suspend customer", "error");
    }
  };

  return (
    <div className="module-page">
      <section className="card module-hero">
        <div className="stat-icon blue">
          <UsersRound size={25} />
        </div>

        <div>
          <h2>Customers</h2>
          <p>Manage customer records and account access.</p>
        </div>

        <div className="module-search">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search customer..."
          />
          <Search size={17} />
        </div>
      </section>

      <section className="card module-table">
        <div className="panel-head">
          <h2>Customers List</h2>
        </div>

        <div className="table-scroll module-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <b>CUS-{customer.id}</b>
                  </td>

                  <td>{customer.full_name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.mobile}</td>

                  <td>
                    <em className={`status-chip ${customer.status}`}>
                      {customer.status}
                    </em>
                  </td>

                  <td>{formatDate(customer.created_at)}</td>

                  <td className="row-actions">
                    <button className="tiny-btn" onClick={() => setSelectedCustomer(customer)}>
                      View Details
                    </button>

                    {customer.status !== "suspended" ? (
                      <button className="tiny-btn red-text" onClick={() => suspendCustomer(customer)}>
                        Suspend
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length ? <div className="empty-state">No customers found.</div> : null}
        </div>
      </section>

      <Modal open={!!selectedCustomer} title="Customer Details" onClose={() => setSelectedCustomer(null)} size="lg">
        <div className="details-clean-grid">
          <b>Customer ID</b>
          <span>CUS-{selectedCustomer?.id}</span>

          <b>Full Name</b>
          <span>{selectedCustomer?.full_name}</span>

          <b>Email</b>
          <span>{selectedCustomer?.email}</span>

          <b>Mobile</b>
          <span>{selectedCustomer?.mobile}</span>

          <b>Status</b>
          <span>{selectedCustomer?.status}</span>

          <b>Email Verified</b>
          <span>{selectedCustomer?.email_verified ? "Yes" : "No"}</span>

          <b>Mobile Verified</b>
          <span>{selectedCustomer?.mobile_verified ? "Yes" : "No"}</span>

          <b>Joined</b>
          <span>{formatDate(selectedCustomer?.created_at)}</span>
        </div>
      </Modal>
    </div>
  );
}