import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  FileText,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Store
} from "lucide-react";

import { adminAPI, formatDate, safeArray } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";
import {
  FormGrid,
  SelectInput,
  TextArea,
  TextInput
} from "../../components/ui/Form.jsx";

const initialVendorForm = {
  company_name: "",
  contact_person: "",
  email: "",
  mobile: "",
  password: "Vendor@12345",
  logo: "",
  company_registration_number: "",
  vat_number: "",
  address: "",
  postcode: "",
  coverage_areas: "",
  insurance_details: "",
  years_experience: "0",
  rating: "0.0",
  total_reviews: "0",
  status: "active",
  verification_status: "verified"
};

const vendorStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "rejected", label: "Rejected" }
];

const verificationOptions = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" }
];

const cleanText = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const formatCoverage = (value) => {
  if (!value) return "—";

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }

  if (typeof value === "string") return value;

  return "—";
};

const parseCoverageAreas = (value) => {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

function VendorSummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="card vendor-summary-card">
      <div className="vendor-summary-icon">
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>
        <b>{value}</b>
      </div>
    </div>
  );
}

function VendorStatusChip({ value }) {
  const status = String(value || "pending").toLowerCase();

  return (
    <em className={`status-chip ${status.replaceAll("_", "-")}`}>
      {status.replaceAll("_", " ")}
    </em>
  );
}

export default function AdminVendorsPage() {
  const { showToast } = useToast();

  const [vendors, setVendors] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialVendorForm);

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const loadVendors = async () => {
    try {
      const response = await adminAPI.vendors({ limit: 50 });
      setVendors(safeArray(response));
    } catch (error) {
      showToast(error.message || "Failed to load vendors", "error");
      setVendors([]);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();

    return vendors.filter((vendor) =>
      [
        vendor.company_name,
        vendor.contact_person,
        vendor.email,
        vendor.mobile,
        vendor.postcode,
        vendor.status,
        vendor.verification_status,
        vendor.company_registration_number,
        vendor.vat_number
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [vendors, keyword]);

  const stats = useMemo(() => {
    return {
      total: vendors.length,
      active: vendors.filter((vendor) => vendor.status === "active").length,
      verified: vendors.filter(
        (vendor) => vendor.verification_status === "verified"
      ).length,
      suspended: vendors.filter((vendor) => vendor.status === "suspended")
        .length
    };
  }, [vendors]);

  const openCreateVendor = () => {
    setForm(initialVendorForm);
    setShowCreate(true);
  };

  const createVendor = async (event) => {
    event.preventDefault();

    if (!form.company_name.trim()) {
      showToast("Company name is required", "error");
      return;
    }

    if (!form.contact_person.trim()) {
      showToast("Contact person is required", "error");
      return;
    }

    if (!form.email.trim()) {
      showToast("Email is required", "error");
      return;
    }

    if (!form.mobile.trim()) {
      showToast("Mobile is required", "error");
      return;
    }

    if (!form.password.trim()) {
      showToast("Password is required", "error");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        company_name: form.company_name.trim(),
        contact_person: form.contact_person.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
        logo: form.logo.trim() || null,
        company_registration_number:
          form.company_registration_number.trim() || null,
        vat_number: form.vat_number.trim() || null,
        address: form.address.trim() || null,
        postcode: form.postcode.trim() || null,
        coverage_areas: parseCoverageAreas(form.coverage_areas),
        insurance_details: form.insurance_details.trim() || null,
        years_experience: Number(form.years_experience || 0),
        rating: Number(form.rating || 0),
        total_reviews: Number(form.total_reviews || 0),
        status: form.status,
        verification_status: form.verification_status
      };

      await adminAPI.createVendor(payload);

      showToast("Vendor created successfully");
      setShowCreate(false);
      setForm(initialVendorForm);
      loadVendors();
    } catch (error) {
      showToast(error.message || "Failed to create vendor", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyVendor = async (vendor) => {
    try {
      await adminAPI.verifyVendor(vendor.id, "verified");
      showToast("Vendor verified");
      loadVendors();
    } catch (error) {
      showToast(error.message || "Failed to verify vendor", "error");
    }
  };

  const suspendVendor = async (vendor) => {
    try {
      await adminAPI.updateVendorStatus(vendor.id, "suspended");
      showToast("Vendor suspended");
      loadVendors();
    } catch (error) {
      showToast(error.message || "Failed to suspend vendor", "error");
    }
  };

  const activateVendor = async (vendor) => {
    try {
      await adminAPI.updateVendorStatus(vendor.id, "active");
      showToast("Vendor activated");
      loadVendors();
    } catch (error) {
      showToast(error.message || "Failed to activate vendor", "error");
    }
  };

  return (
    <div className="module-page admin-vendors-page">
      <style>
        {`
          .admin-vendors-page .vendor-summary-card {
            display: flex;
            align-items: center;
            gap: 14px;
            min-height: 96px;
          }

          .admin-vendors-page .vendor-summary-icon {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            background: #eef5ff;
            color: #0a3a8d;
          }

          .admin-vendors-page .vendor-summary-card span {
            display: block;
            color: #667297;
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 4px;
          }

          .admin-vendors-page .vendor-summary-card b {
            color: #07194f;
            font-size: 24px;
            font-weight: 950;
          }

          .admin-vendors-page .vendor-company-cell {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 230px;
          }

          .admin-vendors-page .vendor-mini-logo {
            width: 42px;
            height: 42px;
            border-radius: 13px;
            background: #07194f;
            color: #ffffff;
            display: grid;
            place-items: center;
            font-size: 16px;
            font-weight: 950;
            flex: 0 0 auto;
          }

          .admin-vendors-page .vendor-company-cell b {
            display: block;
            color: #07194f;
            font-size: 13px;
            font-weight: 950;
            line-height: 1.2;
          }

          .admin-vendors-page .vendor-company-cell small {
            display: block;
            color: #667297;
            font-size: 11px;
            font-weight: 800;
            margin-top: 3px;
          }

          .admin-vendors-page .vendor-create-form {
            height: calc(100vh - 96px);
            max-height: calc(100vh - 96px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            margin: -6px -4px 0;
          }

          .admin-vendors-page .vendor-onboard-body {
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 20px 20px 24px;
          }

          .admin-vendors-page .vendor-onboard-body::-webkit-scrollbar {
            width: 7px;
          }

          .admin-vendors-page .vendor-onboard-body::-webkit-scrollbar-track {
            background: #f2f6fc;
            border-radius: 999px;
          }

          .admin-vendors-page .vendor-onboard-body::-webkit-scrollbar-thumb {
            background: #c8d4e8;
            border-radius: 999px;
          }

          .admin-vendors-page .vendor-create-footer {
            flex: 0 0 auto;
            position: sticky;
            bottom: 0;
            z-index: 20;
            background: #ffffff;
            border-top: 1px solid #dce5f3;
            box-shadow: 0 -12px 34px rgba(7, 25, 79, 0.08);
            padding: 16px 20px;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 14px;
          }

          .admin-vendors-page .vendor-create-footer .outline-btn,
          .admin-vendors-page .vendor-create-footer .red-btn {
            min-height: 44px;
            height: 44px;
            padding-left: 28px;
            padding-right: 28px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 900;
            line-height: 1;
          }

          .admin-vendors-page .vendor-create-footer .outline-btn {
            min-width: 110px;
          }

          .admin-vendors-page .vendor-create-footer .red-btn {
            min-width: 180px;
          }

          .admin-vendors-page .form-section {
            border: 1px solid #dce5f3;
            border-radius: 16px;
            padding: 18px;
            margin-bottom: 18px;
            background: #ffffff;
          }

          .admin-vendors-page .form-section:last-child {
            margin-bottom: 0;
          }

          .admin-vendors-page .form-section-head {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
          }

          .admin-vendors-page .form-section-head svg {
            color: #0a3a8d;
          }

          .admin-vendors-page .form-section-head h3 {
            color: #07194f;
            font-size: 16px;
            font-weight: 950;
            margin: 0;
          }

          .admin-vendors-page .form-section-head p {
            color: #667297;
            font-size: 12px;
            font-weight: 750;
            margin: 3px 0 0;
          }

          .admin-vendors-page .vendor-help-text {
            color: #667297;
            font-size: 12px;
            font-weight: 750;
            margin: 8px 0 0;
          }
        `}
      </style>

      <section className="card module-hero">
        <div className="stat-icon blue">
          <Store size={25} />
        </div>

        <div>
          <h2>Vendors</h2>
          <p>
            Create, verify, suspend and manage moving companies with complete
            onboarding details.
          </p>
        </div>

        <div className="module-search">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search company, contact, email, mobile..."
          />
          <Search size={17} />
        </div>
      </section>

      <div className="module-stats">
        <VendorSummaryCard
          label="Total Vendors"
          value={stats.total}
          icon={Store}
        />

        <VendorSummaryCard
          label="Active Vendors"
          value={stats.active}
          icon={BadgeCheck}
        />

        <VendorSummaryCard
          label="Verified Vendors"
          value={stats.verified}
          icon={ShieldCheck}
        />

        <VendorSummaryCard
          label="Suspended"
          value={stats.suspended}
          icon={BriefcaseBusiness}
        />
      </div>

      <section className="card module-table">
        <div className="panel-head">
          <h2>Vendors List</h2>

          <button className="red-btn" onClick={openCreateVendor}>
            <Plus size={15} />
            Create Vendor
          </button>
        </div>

        <div className="table-scroll module-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Contact</th>
                <th>Registration</th>
                <th>Coverage</th>
                <th>Experience</th>
                <th>Jobs</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((vendor) => (
                <tr key={vendor.id}>
                  <td>
                    <div className="vendor-company-cell">
                      <div className="vendor-mini-logo">
                        {(vendor.company_name || "V").slice(0, 1)}
                      </div>

                      <div>
                        <b>{vendor.company_name}</b>
                        <small>VEN-{vendor.id}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <b>{vendor.contact_person}</b>
                    <small>{vendor.email}</small>
                    <small>{vendor.mobile}</small>
                  </td>

                  <td>
                    {vendor.company_registration_number || "—"}
                    <small>VAT: {vendor.vat_number || "—"}</small>
                  </td>

                  <td>
                    {vendor.postcode || "—"}
                    <small>{formatCoverage(vendor.coverage_areas)}</small>
                  </td>

                  <td>
                    {vendor.years_experience || 0} years
                    <small>
                      ★ {vendor.rating || "0.00"} ({vendor.total_reviews || 0})
                    </small>
                  </td>

                  <td>
                    Assigned: {vendor.assigned_jobs || 0}
                    <small>Quotes: {vendor.submitted_quotes || 0}</small>
                    <small>Won: {vendor.won_jobs || 0}</small>
                  </td>

                  <td>
                    <VendorStatusChip value={vendor.status} />
                  </td>

                  <td>
                    <VendorStatusChip value={vendor.verification_status} />
                  </td>

                  <td className="row-actions">
                    <button
                      className="tiny-btn"
                      onClick={() => setSelectedVendor(vendor)}
                    >
                      View Details
                    </button>

                    {vendor.verification_status !== "verified" ? (
                      <button
                        className="tiny-btn"
                        onClick={() => verifyVendor(vendor)}
                      >
                        Verify
                      </button>
                    ) : null}

                    {vendor.status === "suspended" ? (
                      <button
                        className="tiny-btn"
                        onClick={() => activateVendor(vendor)}
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        className="tiny-btn red-text"
                        onClick={() => suspendVendor(vendor)}
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length ? (
            <div className="empty-state">No vendors found.</div>
          ) : null}
        </div>
      </section>

      <Modal
        open={!!selectedVendor}
        title="Vendor Details"
        onClose={() => setSelectedVendor(null)}
        size="lg"
      >
        <div className="details-clean-grid">
          <b>Vendor ID</b>
          <span>VEN-{selectedVendor?.id}</span>

          <b>Company Name</b>
          <span>{cleanText(selectedVendor?.company_name)}</span>

          <b>Contact Person</b>
          <span>{cleanText(selectedVendor?.contact_person)}</span>

          <b>Email</b>
          <span>{cleanText(selectedVendor?.email)}</span>

          <b>Mobile</b>
          <span>{cleanText(selectedVendor?.mobile)}</span>

          <b>Logo</b>
          <span>{cleanText(selectedVendor?.logo)}</span>

          <b>Company Registration</b>
          <span>{cleanText(selectedVendor?.company_registration_number)}</span>

          <b>VAT Number</b>
          <span>{cleanText(selectedVendor?.vat_number)}</span>

          <b>Address</b>
          <span>{cleanText(selectedVendor?.address)}</span>

          <b>Postcode</b>
          <span>{cleanText(selectedVendor?.postcode)}</span>

          <b>Coverage Areas</b>
          <span>{formatCoverage(selectedVendor?.coverage_areas)}</span>

          <b>Insurance Details</b>
          <span>{cleanText(selectedVendor?.insurance_details)}</span>

          <b>Years Experience</b>
          <span>{selectedVendor?.years_experience || 0}</span>

          <b>Rating</b>
          <span>
            {selectedVendor?.rating || "0.00"} / 5 from{" "}
            {selectedVendor?.total_reviews || 0} reviews
          </span>

          <b>Assigned Jobs</b>
          <span>{selectedVendor?.assigned_jobs || 0}</span>

          <b>Submitted Quotes</b>
          <span>{selectedVendor?.submitted_quotes || 0}</span>

          <b>Won Jobs</b>
          <span>{selectedVendor?.won_jobs || 0}</span>

          <b>Status</b>
          <span>{cleanText(selectedVendor?.status)}</span>

          <b>Verification</b>
          <span>{cleanText(selectedVendor?.verification_status)}</span>

          <b>Created</b>
          <span>{formatDate(selectedVendor?.created_at)}</span>
        </div>
      </Modal>

      <Modal
        open={showCreate}
        title="Create Vendor"
        onClose={() => setShowCreate(false)}
        size="lg"
      >
        <form className="vendor-create-form" onSubmit={createVendor}>
          <div className="vendor-onboard-body">
            <section className="form-section">
              <div className="form-section-head">
                <Building2 size={20} />

                <div>
                  <h3>Company Information</h3>
                  <p>Basic company details used for vendor profile display.</p>
                </div>
              </div>

              <FormGrid>
                <TextInput
                  label="Company Name"
                  value={form.company_name}
                  onChange={(value) => updateForm("company_name", value)}
                  placeholder="MoveMaster Removals Ltd"
                />

                <TextInput
                  label="Contact Person"
                  value={form.contact_person}
                  onChange={(value) => updateForm("contact_person", value)}
                  placeholder="James Carter"
                />

                <TextInput
                  label="Email"
                  value={form.email}
                  onChange={(value) => updateForm("email", value)}
                  placeholder="vendor@example.co.uk"
                />

                <TextInput
                  label="Mobile"
                  value={form.mobile}
                  onChange={(value) => updateForm("mobile", value)}
                  placeholder="+44 7700 900000"
                />

                <TextInput
                  label="Logo URL"
                  value={form.logo}
                  onChange={(value) => updateForm("logo", value)}
                  placeholder="https://example.com/logo.png"
                />

                <TextInput
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(value) => updateForm("password", value)}
                  placeholder="Vendor password"
                />
              </FormGrid>
            </section>

            <section className="form-section">
              <div className="form-section-head">
                <FileText size={20} />

                <div>
                  <h3>Registration Details</h3>
                  <p>Company registration and VAT information.</p>
                </div>
              </div>

              <FormGrid>
                <TextInput
                  label="Company Registration Number"
                  value={form.company_registration_number}
                  onChange={(value) =>
                    updateForm("company_registration_number", value)
                  }
                  placeholder="12345678"
                />

                <TextInput
                  label="VAT Number"
                  value={form.vat_number}
                  onChange={(value) => updateForm("vat_number", value)}
                  placeholder="GB123456789"
                />

                <TextInput
                  label="Years Experience"
                  type="number"
                  value={form.years_experience}
                  onChange={(value) => updateForm("years_experience", value)}
                  placeholder="5"
                />

                <TextInput
                  label="Initial Rating"
                  type="number"
                  value={form.rating}
                  onChange={(value) => updateForm("rating", value)}
                  placeholder="0.0"
                />

                <TextInput
                  label="Total Reviews"
                  type="number"
                  value={form.total_reviews}
                  onChange={(value) => updateForm("total_reviews", value)}
                  placeholder="0"
                />
              </FormGrid>
            </section>

            <section className="form-section">
              <div className="form-section-head">
                <MapPin size={20} />

                <div>
                  <h3>Location & Coverage</h3>
                  <p>Where this vendor operates and accepts jobs.</p>
                </div>
              </div>

              <FormGrid>
                <TextInput
                  label="Postcode"
                  value={form.postcode}
                  onChange={(value) => updateForm("postcode", value)}
                  placeholder="SW1A 1AA"
                />

                <TextInput
                  label="Coverage Areas"
                  value={form.coverage_areas}
                  onChange={(value) => updateForm("coverage_areas", value)}
                  placeholder="London, Manchester, Birmingham"
                />
              </FormGrid>

              <p className="vendor-help-text">
                Enter coverage areas separated by comma. It will be saved as a
                JSON array in the backend.
              </p>

              <TextArea
                label="Address"
                value={form.address}
                onChange={(value) => updateForm("address", value)}
                placeholder="Full registered or office address"
              />
            </section>

            <section className="form-section">
              <div className="form-section-head">
                <ShieldCheck size={20} />

                <div>
                  <h3>Insurance & Verification</h3>
                  <p>Insurance summary and account onboarding status.</p>
                </div>
              </div>

              <TextArea
                label="Insurance Details"
                value={form.insurance_details}
                onChange={(value) => updateForm("insurance_details", value)}
                placeholder="Goods in Transit Insurance, Public Liability Insurance, policy details..."
              />

              <FormGrid>
                <SelectInput
                  label="Account Status"
                  value={form.status}
                  onChange={(value) => updateForm("status", value)}
                  options={vendorStatusOptions}
                />

                <SelectInput
                  label="Verification Status"
                  value={form.verification_status}
                  onChange={(value) =>
                    updateForm("verification_status", value)
                  }
                  options={verificationOptions}
                />
              </FormGrid>
            </section>
          </div>

          <div className="vendor-create-footer">
            <button
              type="button"
              className="outline-btn"
              onClick={() => setShowCreate(false)}
              disabled={submitting}
            >
              Cancel
            </button>

            <button className="red-btn" disabled={submitting}>
              {submitting ? "Creating..." : "Create Vendor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}