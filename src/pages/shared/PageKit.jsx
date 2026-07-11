import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Search,
  UploadCloud
} from "lucide-react";

import Modal from "../../components/ui/Modal.jsx";
import {
  FormGrid,
  SelectInput,
  TextArea,
  TextInput
} from "../../components/ui/Form.jsx";
import { formatDate, money, safeArray } from "../../services/api.js";
import { moveTypeLabel, routeLabel } from "../../utils/mappers.js";

const clean = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  return String(value).replaceAll("_", " ");
};

export function useRows(loader, mapper, deps = []) {
  const [rows, setRows] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await loader();
      const list = safeArray(response);
      setRawRows(list);
      setRows(list.map(mapper));
    } catch (err) {
      setError(err.message || "Unable to load data");
      setRows([]);
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, deps);

  return { rows, rawRows, loading, error, reload };
}

export function moveRow(item) {
  const customer = item.customer || item.customer_data || {};
  const reference = item.job_id || `ANQ-${item.id}`;

  return {
    id: item.id,
    reference,
    name:
      customer.full_name ||
      item.customer_name ||
      item.property_size ||
      item.property_type ||
      "Move Request",
    status: item.status || "pending",
    date: formatDate(item.moving_date || item.created_at),
    priority: item.priority ? "High" : "Normal",
    route: routeLabel(item.pickup_postcode, item.delivery_postcode),
    details: {
      "Job ID": reference,
      Customer: customer.full_name || item.customer_name || "Hidden until booking",
      "Move Type": moveTypeLabel(item.move_type),
      "Pickup Postcode": item.pickup_postcode,
      "Delivery Postcode": item.delivery_postcode,
      Route: routeLabel(item.pickup_postcode, item.delivery_postcode),
      "Moving Date": formatDate(item.moving_date),
      "Property Type": item.property_type,
      "Property Size": item.property_size,
      Status: item.status,
      "Profile Completion": item.profile_completion_percent
        ? `${item.profile_completion_percent}%`
        : "—",
      "Deposit Paid": item.deposit_paid,
      "Contact Released": item.contact_released
    }
  };
}

export function vendorRow(item) {
  return {
    id: item.id,
    reference: `VEN-${item.id}`,
    name: item.company_name || "Vendor",
    status: item.status || item.verification_status || "pending",
    date: formatDate(item.created_at),
    priority: item.verification_status || "Normal",
    details: {
      "Vendor ID": `VEN-${item.id}`,
      Company: item.company_name,
      "Contact Person": item.contact_person,
      Email: item.email,
      Mobile: item.mobile,
      Postcode: item.postcode,
      Status: item.status,
      Verification: item.verification_status,
      Rating: item.rating,
      Reviews: item.total_reviews
    }
  };
}

export function customerRow(item) {
  return {
    id: item.id,
    reference: `CUS-${item.id}`,
    name: item.full_name || "Customer",
    status: item.status || "active",
    date: formatDate(item.created_at),
    priority: item.mobile || "Normal",
    details: {
      "Customer ID": `CUS-${item.id}`,
      Name: item.full_name,
      Email: item.email,
      Mobile: item.mobile,
      Status: item.status,
      "Email Verified": item.email_verified,
      "Mobile Verified": item.mobile_verified,
      "Joined On": formatDate(item.created_at)
    }
  };
}

export function quoteRow(item) {
  const move = item.move || {};
  const vendor = item.vendor || {};

  return {
    id: item.id,
    reference: move.job_id || `QUOTE-${item.id}`,
    name: vendor.company_name || item.vendor_name || money(item.quote_amount),
    status: item.status || "submitted",
    date: formatDate(item.submitted_at || item.created_at),
    priority: item.currency || "GBP",
    details: {
      "Quote ID": `QUOTE-${item.id}`,
      "Job ID": move.job_id,
      Vendor: vendor.company_name || item.vendor_name,
      Amount: money(item.quote_amount),
      Currency: item.currency || "GBP",
      "Available From": formatDate(item.availability_from),
      "Available To": formatDate(item.availability_to),
      Insurance: item.insurance_summary,
      "Number of Movers": item.number_of_movers,
      "Van Details": item.van_details,
      Notes: item.additional_notes,
      Status: item.status
    }
  };
}

export function paymentRow(item) {
  const move = item.move || {};

  return {
    id: item.id,
    reference: move.job_id || `PAY-${item.id}`,
    name: money(item.amount),
    status: item.status || "pending",
    date: formatDate(item.paid_at || item.created_at),
    priority: item.payment_gateway || "Stripe",
    details: {
      "Payment ID": `PAY-${item.id}`,
      "Job ID": move.job_id,
      Amount: money(item.amount),
      Currency: item.currency || "GBP",
      Type: item.payment_type,
      Gateway: item.payment_gateway,
      Status: item.status,
      "Paid At": formatDate(item.paid_at)
    }
  };
}

export function messageRow(item) {
  return {
    id: item.id,
    reference: item.title || item.subject || `MSG-${item.id}`,
    name: item.message || item.last_message || "Conversation",
    status: item.is_read ? "read" : item.status || "new",
    date: formatDate(item.created_at || item.last_message_at),
    priority: item.sender_type || item.type || "Message",
    details: {
      Reference: item.title || item.subject || `MSG-${item.id}`,
      Message: item.message || item.last_message,
      Sender: item.sender_type,
      Status: item.is_read ? "Read" : item.status || "New",
      Date: formatDate(item.created_at || item.last_message_at)
    }
  };
}

export function auditRow(item) {
  return {
    id: item.id,
    reference: item.module || `AUDIT-${item.id}`,
    name: item.action || "Activity",
    status: item.actor_type || "system",
    date: formatDate(item.created_at),
    priority: item.target_type || "Normal",
    details: {
      Module: item.module,
      Action: item.action,
      Actor: item.actor_type,
      "Actor ID": item.actor_id,
      Target: item.target_type,
      "Target ID": item.target_id,
      IP: item.ip_address,
      Date: formatDate(item.created_at)
    }
  };
}

export function profileRow(item, role = "customer") {
  return {
    id: item.id || 1,
    reference: role === "vendor" ? `VEN-${item.id || 1}` : `USER-${item.id || 1}`,
    name: item.full_name || item.company_name || item.name || "Profile",
    status: item.status || item.verification_status || "active",
    date: formatDate(item.created_at),
    priority: role,
    details: {
      Name: item.full_name || item.name,
      Company: item.company_name,
      Email: item.email,
      Mobile: item.mobile,
      Status: item.status,
      Verification: item.verification_status,
      Role: role
    }
  };
}

export function DataPage({
  title,
  description,
  rows,
  loading,
  error,
  createLabel,
  onCreate,
  onView,
  actions = []
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();

    return rows.filter((row) =>
      [
        row.reference,
        row.name,
        row.status,
        row.date,
        row.priority,
        row.route
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((r) =>
        /active|confirmed|submitted|assigned|verified/i.test(r.status)
      ).length,
      pending: rows.filter((r) =>
        /pending|profile|new|assigned|in progress/i.test(r.status)
      ).length,
      completed: rows.filter((r) =>
        /completed|succeeded|verified|read/i.test(r.status)
      ).length
    };
  }, [rows]);

  return (
    <div className="module-page">
      {error ? (
        <div className="api-warning">
          Could not load live backend rows. {error}
        </div>
      ) : null}

      <section className="card module-hero">
        <div className="stat-icon blue">
          <ClipboardList size={25} />
        </div>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="module-search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, name, status..."
          />
          <Search size={17} />
        </div>
      </section>

      <div className="module-stats">
        <div className="card">
          <span>Total</span>
          <b>{stats.total}</b>
          <p>Records</p>
        </div>

        <div className="card">
          <span>Active</span>
          <b>{stats.active}</b>
          <p>Currently active</p>
        </div>

        <div className="card">
          <span>Pending</span>
          <b>{stats.pending}</b>
          <p>Needs attention</p>
        </div>

        <div className="card">
          <span>Completed</span>
          <b>{stats.completed}</b>
          <p>Finished</p>
        </div>
      </div>

      <section className="card module-table">
        <div className="panel-head">
          <h2>{title} List</h2>

          {onCreate ? (
            <button className="red-btn" onClick={onCreate}>
              {createLabel || "Create New"}
            </button>
          ) : null}
        </div>

        <div className="table-scroll module-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Name</th>
                <th>Status</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((row) => (
                <tr key={`${row.reference}-${row.id}`}>
                  <td>
                    <b>{row.reference}</b>
                    {row.route ? <small>{row.route}</small> : null}
                  </td>

                  <td>{row.name}</td>

                  <td>
                    <em
                      className={`status-chip ${String(row.status)
                        .toLowerCase()
                        .replaceAll("_", "-")
                        .replaceAll(" ", "-")}`}
                    >
                      {clean(row.status)}
                    </em>
                  </td>

                  <td>
                    <CalendarDays size={13} />
                    {row.date}
                  </td>

                  <td>
                    <em
                      className={
                        row.priority === "High"
                          ? "priority-high"
                          : "priority-normal"
                      }
                    >
                      {clean(row.priority)}
                    </em>
                  </td>

                  <td className="row-actions">
                    <button className="tiny-btn" onClick={() => onView(row)}>
                      View Details
                    </button>

                    {actions
                      .filter((action) => !action.show || action.show(row))
                      .map((action) => (
                        <button
                          key={action.label}
                          className={
                            action.tone === "danger"
                              ? "tiny-btn red-text"
                              : "tiny-btn"
                          }
                          onClick={() => action.onClick(row)}
                        >
                          {action.label}
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 ? (
            <div className="empty-state">No records found.</div>
          ) : null}
        </div>

        {loading ? <p className="table-loading">Loading...</p> : null}
      </section>
    </div>
  );
}

export function DetailsModal({ open, title = "Details", row, onClose }) {
  const entries = Object.entries(row?.details || {
    Reference: row?.reference,
    Name: row?.name,
    Status: row?.status,
    Date: row?.date,
    Priority: row?.priority
  }).filter(([_, value]) => value !== undefined && value !== null && value !== "");

  return (
    <Modal open={open} title={title} onClose={onClose} size="lg">
      <div className="details-clean-grid">
        {entries.map(([label, value]) => (
          <React.Fragment key={label}>
            <b>{label}</b>
            <span>{clean(value)}</span>
          </React.Fragment>
        ))}
      </div>
    </Modal>
  );
}

export function MoveCreateModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    move_type: "house_move",
    moving_date: "",
    pickup_postcode: "",
    delivery_postcode: "",
    property_type: "House",
    property_size: "2 Bed Flat",
    pickup_address: "",
    delivery_address: ""
  });

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal open={open} title="Create Move Request" onClose={onClose} size="lg">
      <form onSubmit={submit}>
        <FormGrid>
          <SelectInput
            label="Move Type"
            value={form.move_type}
            onChange={(v) => setForm({ ...form, move_type: v })}
            options={["house_move", "office_move", "packing", "storage"]}
          />

          <TextInput
            label="Moving Date"
            type="date"
            value={form.moving_date}
            onChange={(v) => setForm({ ...form, moving_date: v })}
          />

          <TextInput
            label="Pickup Postcode"
            value={form.pickup_postcode}
            onChange={(v) => setForm({ ...form, pickup_postcode: v })}
          />

          <TextInput
            label="Delivery Postcode"
            value={form.delivery_postcode}
            onChange={(v) => setForm({ ...form, delivery_postcode: v })}
          />

          <TextInput
            label="Property Type"
            value={form.property_type}
            onChange={(v) => setForm({ ...form, property_type: v })}
          />

          <TextInput
            label="Property Size"
            value={form.property_size}
            onChange={(v) => setForm({ ...form, property_size: v })}
          />
        </FormGrid>

        <div className="modal-actions">
          <button type="button" className="outline-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="red-btn">Create Move</button>
        </div>
      </form>
    </Modal>
  );
}

export function VendorCreateModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    mobile: "",
    password: "Vendor@12345",
    status: "active",
    verification_status: "verified"
  });

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal open={open} title="Create Vendor" onClose={onClose} size="lg">
      <form onSubmit={submit}>
        <FormGrid>
          <TextInput
            label="Company Name"
            value={form.company_name}
            onChange={(v) => setForm({ ...form, company_name: v })}
          />

          <TextInput
            label="Contact Person"
            value={form.contact_person}
            onChange={(v) => setForm({ ...form, contact_person: v })}
          />

          <TextInput
            label="Email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />

          <TextInput
            label="Mobile"
            value={form.mobile}
            onChange={(v) => setForm({ ...form, mobile: v })}
          />

          <TextInput
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
          />
        </FormGrid>

        <div className="modal-actions">
          <button type="button" className="outline-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="red-btn">Create Vendor</button>
        </div>
      </form>
    </Modal>
  );
}

export function UploadDocumentsModal({ open, onClose, moves, onSubmit }) {
  const [form, setForm] = useState({
    move_request_id: "",
    file_type: "photo",
    files: null
  });

  const submit = (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("file_type", form.file_type);
    Array.from(form.files || []).forEach((file) => fd.append("files", file));

    onSubmit(form.move_request_id, fd);
  };

  return (
    <Modal open={open} title="Upload Move Documents" onClose={onClose}>
      <form onSubmit={submit}>
        <SelectInput
          label="Move Request"
          value={form.move_request_id}
          onChange={(v) => setForm({ ...form, move_request_id: v })}
          options={[
            { value: "", label: "Choose move" },
            ...moves.map((row) => ({
              value: row.id,
              label: row.reference
            }))
          ]}
        />

        <SelectInput
          label="File Type"
          value={form.file_type}
          onChange={(v) => setForm({ ...form, file_type: v })}
          options={["inventory", "photo", "video", "document"]}
        />

        <label className="upload-drop">
          <UploadCloud size={24} />
          <span>Select files</span>
          <input
            type="file"
            multiple
            onChange={(e) => setForm({ ...form, files: e.target.files })}
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="outline-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="red-btn">Upload</button>
        </div>
      </form>
    </Modal>
  );
}

export function SupportModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    mobile: "",
    message: ""
  });

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal open={open} title="Contact Support" onClose={onClose}>
      <form onSubmit={submit}>
        <TextInput
          label="Full Name"
          value={form.full_name}
          onChange={(v) => setForm({ ...form, full_name: v })}
        />

        <TextInput
          label="Email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />

        <TextInput
          label="Mobile"
          value={form.mobile}
          onChange={(v) => setForm({ ...form, mobile: v })}
        />

        <TextArea
          label="Message"
          value={form.message}
          onChange={(v) => setForm({ ...form, message: v })}
        />

        <div className="modal-actions">
          <button type="button" className="outline-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="red-btn">Send</button>
        </div>
      </form>
    </Modal>
  );
}