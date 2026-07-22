import React, { useMemo, useState } from "react";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  KeyRound,
  MapPin,
  MapPinned,
  Navigation,
  Save,
  ShieldCheck,
  Store,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { adminAPI } from "../../services/api.js";

import { useToast } from "../../components/ui/Toast.jsx";

import {
  FormGrid,
  SelectInput,
  TextArea,
  TextInput,
} from "../../components/ui/Form.jsx";

import VendorBoundaryMap from "../../components/maps/VendorBoundaryMap.jsx";

const createInitialVendorForm = () => ({
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

  selected_place: null,
  service_boundary: [],

  insurance_details: "",
  years_experience: "0",
  rating: "0.0",
  total_reviews: "0",

  status: "active",
  verification_status: "verified",
});

const vendorStatusOptions = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "suspended",
    label: "Suspended",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

const verificationOptions = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "verified",
    label: "Verified",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

const parseCoverageAreas = (value) => {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeBoundary = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((point) => ({
      lat: Number(point?.lat),
      lng: Number(point?.lng),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.lat) &&
        Number.isFinite(point.lng) &&
        point.lat >= -90 &&
        point.lat <= 90 &&
        point.lng >= -180 &&
        point.lng <= 180,
    );
};

const getApiErrorMessage = (error, fallbackMessage) => {
  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section className={`card create-vendor-section ${className}`}>
      <div className="create-section-head">
        <div className="create-section-icon">
          <Icon size={20} />
        </div>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="create-section-body">{children}</div>
    </section>
  );
}

export default function AdminCreateVendorPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(createInitialVendorForm());

  const [submitting, setSubmitting] = useState(false);

  const updateForm = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handlePlaceSelect = (place) => {
    if (!place) {
      setForm((previous) => ({
        ...previous,
        selected_place: null,
      }));

      return;
    }

    setForm((previous) => {
      const coverageAreas = [place.locality, place.administrativeArea]
        .filter(Boolean)
        .filter((item, index, array) => array.indexOf(item) === index)
        .join(", ");

      return {
        ...previous,

        selected_place: place,

        address: place.formattedAddress || previous.address,

        postcode: place.postcode
          ? String(place.postcode).toUpperCase()
          : previous.postcode,

        coverage_areas: previous.coverage_areas.trim()
          ? previous.coverage_areas
          : coverageAreas,
      };
    });
  };

  const boundaryPoints = useMemo(
    () => normalizeBoundary(form.service_boundary),
    [form.service_boundary],
  );

  const requiredDetailsComplete = useMemo(
    () =>
      Boolean(
        form.company_name.trim() &&
        form.contact_person.trim() &&
        form.email.trim() &&
        form.mobile.trim() &&
        form.password.trim(),
      ),
    [
      form.company_name,
      form.contact_person,
      form.email,
      form.mobile,
      form.password,
    ],
  );

  const boundaryComplete = boundaryPoints.length >= 3;

  const formReady = requiredDetailsComplete && boundaryComplete;

  const cancelCreate = () => {
    if (submitting) {
      return;
    }

    navigate("/admin/vendors");
  };

  const validateForm = () => {
    if (!form.company_name.trim()) {
      showToast("Company name is required", "error");

      return false;
    }

    if (!form.contact_person.trim()) {
      showToast("Contact person is required", "error");

      return false;
    }

    if (!form.email.trim()) {
      showToast("Email is required", "error");

      return false;
    }

    if (!form.mobile.trim()) {
      showToast("Mobile number is required", "error");

      return false;
    }

    if (!form.password.trim()) {
      showToast("Password is required", "error");

      return false;
    }

    if (boundaryPoints.length < 3) {
      showToast(
        "Draw the vendor service boundary using at least three map points",
        "error",
      );

      return false;
    }

    const yearsExperience = Number(form.years_experience || 0);

    if (!Number.isFinite(yearsExperience) || yearsExperience < 0) {
      showToast("Years of experience must be zero or greater", "error");

      return false;
    }

    const rating = Number(form.rating || 0);

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      showToast("Rating must be between 0 and 5", "error");

      return false;
    }

    const totalReviews = Number(form.total_reviews || 0);

    if (!Number.isFinite(totalReviews) || totalReviews < 0) {
      showToast("Total reviews must be zero or greater", "error");

      return false;
    }

    return true;
  };

  const createVendor = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        company_name: form.company_name.trim(),

        contact_person: form.contact_person.trim(),

        email: form.email.trim().toLowerCase(),

        mobile: form.mobile.trim(),

        password: form.password,

        logo: form.logo.trim() || null,

        company_registration_number:
          form.company_registration_number.trim() || null,

        vat_number: form.vat_number.trim() || null,

        address: form.address.trim() || null,

        postcode: form.postcode.trim().toUpperCase() || null,

        coverage_areas: parseCoverageAreas(form.coverage_areas),

        service_location: form.selected_place
          ? {
              ...form.selected_place,

              lat: Number(form.selected_place.lat),

              lng: Number(form.selected_place.lng),
            }
          : null,

        service_boundary: boundaryPoints,

        insurance_details: form.insurance_details.trim() || null,

        years_experience: Number(form.years_experience || 0),

        rating: Number(form.rating || 0),

        total_reviews: Number(form.total_reviews || 0),

        status: form.status,

        verification_status: form.verification_status,
      };

      await adminAPI.createVendor(payload);

      showToast("Vendor created successfully");

      navigate("/admin/vendors", {
        replace: true,
      });
    } catch (error) {
      showToast(getApiErrorMessage(error, "Failed to create vendor"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="module-page admin-create-vendor-page">
      <style>
        {`
          .admin-create-vendor-page {
            padding-bottom: 0;
          }

          .admin-create-vendor-page .create-vendor-header {
            display: flex;
            align-items: center;
            gap: 16px;
            min-height: 104px;
            padding: 20px 22px;
          }

          .admin-create-vendor-page .create-back-btn {
            width: 42px;
            height: 42px;
            flex: 0 0 auto;
            border: 1px solid #d8e2f0;
            border-radius: 12px;
            background: #ffffff;
            color: #07194f;
            display: grid;
            place-items: center;
            cursor: pointer;
            transition: 0.2s ease;
          }

          .admin-create-vendor-page .create-back-btn:hover {
            border-color: #005eff;
            color: #005eff;
            background: #f4f8ff;
          }

          .admin-create-vendor-page .create-header-icon {
            width: 52px;
            height: 52px;
            flex: 0 0 auto;
            border-radius: 15px;
            display: grid;
            place-items: center;
            background: #07194f;
            color: #ffffff;
          }

          .admin-create-vendor-page .create-header-content {
            flex: 1;
            min-width: 0;
          }

          .admin-create-vendor-page .create-header-content h1 {
            margin: 0;
            color: #07194f;
            font-size: 23px;
            line-height: 1.2;
            font-weight: 950;
          }

          .admin-create-vendor-page .create-header-content p {
            margin: 6px 0 0;
            color: #667297;
            font-size: 13px;
            line-height: 1.55;
            font-weight: 750;
          }

          .admin-create-vendor-page .create-header-status {
            display: flex;
            align-items: center;
            gap: 9px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }

          .admin-create-vendor-page .create-status-pill {
            min-height: 34px;
            padding: 0 12px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            border: 1px solid #d9e3f1;
            background: #f7f9fd;
            color: #667297;
            font-size: 11px;
            font-weight: 900;
            white-space: nowrap;
          }

          .admin-create-vendor-page .create-status-pill.complete {
            border-color: #b9e5c8;
            background: #eaf9ef;
            color: #11703b;
          }

          .admin-create-vendor-page .create-status-pill.pending {
            border-color: #f0d9a8;
            background: #fff8e9;
            color: #97640c;
          }

          .admin-create-vendor-page .create-vendor-form {
            margin-top: 18px;
          }

          .admin-create-vendor-page .create-vendor-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 310px;
            align-items: start;
            gap: 18px;
          }

          .admin-create-vendor-page .create-main-column {
            min-width: 0;
          }

          .admin-create-vendor-page .create-side-column {
            position: sticky;
            top: 18px;
            display: grid;
            gap: 18px;
          }

          .admin-create-vendor-page .create-vendor-section {
            padding: 0;
            overflow: visible;
            margin-bottom: 18px;
          }

          .admin-create-vendor-page .create-section-head {
            min-height: 76px;
            padding: 17px 19px;
            border-bottom: 1px solid #e0e7f1;
            background: #fbfcff;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            border-radius: 16px 16px 0 0;
          }

          .admin-create-vendor-page .create-section-icon {
            width: 38px;
            height: 38px;
            flex: 0 0 auto;
            border-radius: 11px;
            background: #eaf2ff;
            color: #0a3a8d;
            display: grid;
            place-items: center;
          }

          .admin-create-vendor-page .create-section-head h2 {
            margin: 0;
            color: #07194f;
            font-size: 16px;
            line-height: 1.35;
            font-weight: 950;
          }

          .admin-create-vendor-page .create-section-head p {
            margin: 4px 0 0;
            color: #667297;
            font-size: 12px;
            line-height: 1.55;
            font-weight: 750;
          }

          .admin-create-vendor-page .create-section-body {
            padding: 20px;
          }

          .admin-create-vendor-page .create-help-text {
            margin: 10px 0 16px;
            color: #667297;
            font-size: 12px;
            line-height: 1.65;
            font-weight: 750;
          }

          .admin-create-vendor-page .create-help-text strong {
            color: #07194f;
          }

          .admin-create-vendor-page .selected-google-place {
            margin: 0 0 18px;
            border: 1px solid #c6d9f4;
            border-radius: 12px;
            padding: 14px;
            background: #f4f8ff;
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }

          .admin-create-vendor-page .selected-google-place-icon {
            width: 39px;
            height: 39px;
            flex: 0 0 auto;
            border-radius: 11px;
            background: #005eff;
            color: #ffffff;
            display: grid;
            place-items: center;
          }

          .admin-create-vendor-page .selected-google-place-content {
            min-width: 0;
            flex: 1;
          }

          .admin-create-vendor-page .selected-google-place small {
            display: block;
            color: #005eff;
            font-size: 9px;
            font-weight: 950;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .admin-create-vendor-page .selected-google-place b {
            display: block;
            margin-top: 4px;
            color: #07194f;
            font-size: 13px;
            font-weight: 950;
            line-height: 1.45;
          }

          .admin-create-vendor-page .selected-google-place span {
            display: block;
            margin-top: 3px;
            color: #667297;
            font-size: 11px;
            font-weight: 750;
            line-height: 1.55;
          }

          .admin-create-vendor-page .selected-google-place-coordinates {
            color: #005eff !important;
            font-family: monospace;
            font-size: 10px !important;
            font-weight: 900 !important;
          }

          .admin-create-vendor-page .selected-google-place-status {
            margin-top: 8px;
            width: fit-content;
            min-height: 25px;
            border-radius: 999px;
            padding: 0 9px;
            display: inline-flex !important;
            align-items: center;
            border: 1px solid #b9e5c8;
            background: #eaf9ef;
            color: #11703b !important;
            font-size: 9px !important;
            font-weight: 950 !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .admin-create-vendor-page .create-summary-card {
            padding: 18px;
          }

          .admin-create-vendor-page .create-summary-card h3 {
            margin: 0;
            color: #07194f;
            font-size: 15px;
            font-weight: 950;
          }

          .admin-create-vendor-page .create-summary-card > p {
            margin: 6px 0 0;
            color: #667297;
            font-size: 12px;
            line-height: 1.55;
            font-weight: 750;
          }

          .admin-create-vendor-page .create-summary-list {
            margin-top: 17px;
            display: grid;
            gap: 11px;
          }

          .admin-create-vendor-page .create-summary-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-height: 42px;
            border: 1px solid #e0e7f1;
            border-radius: 10px;
            padding: 9px 11px;
            background: #fbfcff;
          }

          .admin-create-vendor-page .create-summary-item span {
            color: #667297;
            font-size: 11px;
            font-weight: 850;
          }

          .admin-create-vendor-page .create-summary-item b {
            max-width: 165px;
            color: #07194f;
            font-size: 11px;
            font-weight: 950;
            text-align: right;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-create-vendor-page .create-summary-item b.good {
            color: #11703b;
          }

          .admin-create-vendor-page .create-summary-item b.warning {
            color: #b80d16;
          }

          .admin-create-vendor-page .create-password-card {
            padding: 18px;
            border: 1px solid #d9e5f5;
            background: #f5f9ff;
          }

          .admin-create-vendor-page .create-password-head {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .admin-create-vendor-page .create-password-head svg {
            color: #005eff;
          }

          .admin-create-vendor-page .create-password-head h3 {
            margin: 0;
            color: #07194f;
            font-size: 14px;
            font-weight: 950;
          }

          .admin-create-vendor-page .create-password-card p {
            margin: 10px 0 0;
            color: #667297;
            font-size: 12px;
            line-height: 1.65;
            font-weight: 750;
          }

          .admin-create-vendor-page .create-password-value {
            margin-top: 13px;
            min-height: 42px;
            padding: 0 12px;
            border-radius: 9px;
            background: #ffffff;
            border: 1px dashed #aebed6;
            color: #07194f;
            display: flex;
            align-items: center;
            font-family: monospace;
            font-size: 13px;
            font-weight: 900;
            word-break: break-all;
          }

          .admin-create-vendor-page .create-form-actions {
            position: sticky;
            bottom: 0;
            z-index: 30;
            min-height: 76px;
            margin: 18px -2px 0;
            padding: 14px 18px;
            border-top: 1px solid #dce5f3;
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(14px);
            box-shadow: 0 -12px 34px rgba(7, 25, 79, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
          }

          .admin-create-vendor-page .create-action-message {
            display: flex;
            align-items: center;
            gap: 9px;
            color: #667297;
            font-size: 12px;
            font-weight: 800;
          }

          .admin-create-vendor-page .create-action-message.ready {
            color: #11703b;
          }

          .admin-create-vendor-page .create-action-buttons {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
          }

          .admin-create-vendor-page .create-action-buttons button {
            min-height: 45px;
            padding: 0 25px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 950;
            white-space: nowrap;
          }

          .admin-create-vendor-page .create-action-buttons .red-btn {
            min-width: 185px;
          }

          .admin-create-vendor-page button:disabled {
            cursor: not-allowed;
            opacity: 0.58;
          }

          @media (max-width: 1120px) {
            .admin-create-vendor-page .create-vendor-layout {
              grid-template-columns: minmax(0, 1fr);
            }

            .admin-create-vendor-page .create-side-column {
              position: static;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 760px) {
            .admin-create-vendor-page .create-vendor-header {
              align-items: flex-start;
              flex-wrap: wrap;
            }

            .admin-create-vendor-page .create-header-icon {
              display: none;
            }

            .admin-create-vendor-page .create-header-content {
              width: calc(100% - 60px);
            }

            .admin-create-vendor-page .create-header-status {
              width: 100%;
              justify-content: flex-start;
            }

            .admin-create-vendor-page .create-side-column {
              grid-template-columns: 1fr;
            }

            .admin-create-vendor-page .create-section-body {
              padding: 16px;
            }

            .admin-create-vendor-page .create-form-actions {
              align-items: stretch;
              flex-direction: column;
            }

            .admin-create-vendor-page .create-action-message {
              justify-content: center;
              text-align: center;
            }

            .admin-create-vendor-page .create-action-buttons {
              width: 100%;
              flex-direction: column-reverse;
            }

            .admin-create-vendor-page .create-action-buttons button {
              width: 100%;
            }
          }
        `}
      </style>

      <section className="card create-vendor-header">
        <button
          type="button"
          className="create-back-btn"
          onClick={cancelCreate}
          aria-label="Back to vendors"
          disabled={submitting}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="create-header-icon">
          <Store size={25} />
        </div>

        <div className="create-header-content">
          <h1>Create Vendor</h1>

          <p>
            Add the moving company, login credentials, operational coverage and
            map-based service boundary.
          </p>
        </div>

        <div className="create-header-status">
          <span
            className={`create-status-pill ${
              requiredDetailsComplete ? "complete" : "pending"
            }`}
          >
            <CheckCircle2 size={14} />

            {requiredDetailsComplete
              ? "Required details complete"
              : "Required details pending"}
          </span>

          <span
            className={`create-status-pill ${
              boundaryComplete ? "complete" : "pending"
            }`}
          >
            <MapPinned size={14} />

            {boundaryComplete
              ? `${boundaryPoints.length} boundary points`
              : "Boundary required"}
          </span>
        </div>
      </section>

      <form className="create-vendor-form" onSubmit={createVendor}>
        <div className="create-vendor-layout">
          <div className="create-main-column">
            <FormSection
              icon={Building2}
              title="Company Information"
              description="Basic company details and credentials used for the vendor account."
            >
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
                  type="email"
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
                  label="Login Password"
                  type="password"
                  value={form.password}
                  onChange={(value) => updateForm("password", value)}
                  placeholder="Vendor password"
                />
              </FormGrid>
            </FormSection>

            <FormSection
              icon={FileText}
              title="Registration Details"
              description="Company registration, VAT, experience and initial review information."
            >
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
            </FormSection>

            <FormSection
              icon={MapPin}
              title="Location & Coverage"
              description="Registered address, postcode and readable coverage area names."
            >
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
                  placeholder="London, Croydon, Watford"
                />
              </FormGrid>

              <p className="create-help-text">
                Selecting a Google Maps search result automatically fills the
                address and postcode. You can still edit these values manually.
              </p>

              <TextArea
                label="Registered / Office Address"
                value={form.address}
                onChange={(value) => updateForm("address", value)}
                placeholder="Enter the complete company address"
              />
            </FormSection>

            <FormSection
              icon={MapPinned}
              title="Service Boundary"
              description="Search for a place or manually drop and drag the location pin. The pin can be changed before or after completing the service boundary."
            >
              <VendorBoundaryMap
                value={form.service_boundary}
                onChange={(value) => updateForm("service_boundary", value)}
                onPlaceSelect={handlePlaceSelect}
                locationValue={form.selected_place}
                postcode={form.postcode}
                height={500}
              />

              <p className="create-help-text">
                <strong>Searching is optional.</strong> Use{" "}
                <strong>Drop Pin Manually</strong> to create a location pin at
                the current map centre. Click anywhere on the map or drag the
                pin to the exact vendor location. The pin can still be moved
                after completing the boundary without deleting or changing the
                existing boundary points.
              </p>
            </FormSection>

            <FormSection
              icon={ShieldCheck}
              title="Insurance & Account Status"
              description="Add insurance information and define the initial account and verification status."
            >
              <TextArea
                label="Insurance Details"
                value={form.insurance_details}
                onChange={(value) => updateForm("insurance_details", value)}
                placeholder="Goods in Transit Insurance, Public Liability Insurance, provider, policy number and expiry date..."
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
                  onChange={(value) => updateForm("verification_status", value)}
                  options={verificationOptions}
                />
              </FormGrid>
            </FormSection>
          </div>

          <aside className="create-side-column">
            <section className="card create-summary-card">
              <h3>Vendor Summary</h3>

              <p>
                Review the important onboarding information before creating the
                vendor.
              </p>

              <div className="create-summary-list">
                <div className="create-summary-item">
                  <span>Company</span>

                  <b>{form.company_name.trim() || "Not entered"}</b>
                </div>

                <div className="create-summary-item">
                  <span>Contact</span>

                  <b>{form.contact_person.trim() || "Not entered"}</b>
                </div>

                <div className="create-summary-item">
                  <span>Map Location</span>

                  <b
                    className={form.selected_place ? "good" : "warning"}
                    title={form.selected_place?.formattedAddress || ""}
                  >
                    {form.selected_place?.displayName || "Not selected"}
                  </b>
                </div>

                <div className="create-summary-item">
                  <span>Pin Coordinates</span>

                  <b
                    className={form.selected_place ? "good" : "warning"}
                    title={
                      form.selected_place
                        ? `${form.selected_place.lat}, ${form.selected_place.lng}`
                        : ""
                    }
                  >
                    {form.selected_place
                      ? `${Number(form.selected_place.lat).toFixed(5)}, ${Number(
                          form.selected_place.lng,
                        ).toFixed(5)}`
                      : "Not selected"}
                  </b>
                </div>

                <div className="create-summary-item">
                  <span>Postcode</span>

                  <b>{form.postcode.trim() || "Not entered"}</b>
                </div>

                <div className="create-summary-item">
                  <span>Boundary</span>

                  <b className={boundaryComplete ? "good" : "warning"}>
                    {boundaryComplete
                      ? `${boundaryPoints.length} points`
                      : "Required"}
                  </b>
                </div>

                <div className="create-summary-item">
                  <span>Account Status</span>

                  <b>{form.status}</b>
                </div>

                <div className="create-summary-item">
                  <span>Verification</span>

                  <b>{form.verification_status}</b>
                </div>
              </div>
            </section>

            <section className="card create-password-card">
              <div className="create-password-head">
                <KeyRound size={18} />

                <h3>Initial Login</h3>
              </div>

              <p>
                Share the email and temporary password securely with the vendor.
                The password is hashed by the backend before it is stored.
              </p>

              <div className="create-password-value">
                {form.password || "No password entered"}
              </div>
            </section>
          </aside>
        </div>

        <div className="create-form-actions">
          <div className={`create-action-message ${formReady ? "ready" : ""}`}>
            {formReady ? (
              <>
                <CheckCircle2 size={17} />
                Vendor information is ready to submit.
              </>
            ) : (
              <>
                <MapPinned size={17} />
                Complete the required details and draw the service boundary.
              </>
            )}
          </div>

          <div className="create-action-buttons">
            <button
              type="button"
              className="outline-btn"
              onClick={cancelCreate}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="red-btn"
              disabled={submitting || !formReady}
            >
              <Save size={16} />

              {submitting ? "Creating Vendor..." : "Create Vendor"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
