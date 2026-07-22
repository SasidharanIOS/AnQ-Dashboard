import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeCheck,
  Edit3,
  Eye,
  MapPinned,
  Plus,
  Search,
  ShieldCheck,
  Store,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  adminAPI,
  safeArray,
} from "../../services/api.js";

import { useToast } from "../../components/ui/Toast.jsx";

const parseMaybeJson = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return value;
  }

  if (
    !trimmed.startsWith("[") &&
    !trimmed.startsWith("{")
  ) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const normalizeBoundary = (value) => {
  const parsed = parseMaybeJson(value);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
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

const normalizeLocation = (value) => {
  const parsed = parseMaybeJson(value);

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const lat = Number(parsed.lat);
  const lng = Number(parsed.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return {
    ...parsed,
    lat,
    lng,
  };
};

const formatCoverage = (value) => {
  const parsed = parseMaybeJson(value);

  if (Array.isArray(parsed)) {
    return parsed.length
      ? parsed.join(", ")
      : "—";
  }

  if (
    parsed === null ||
    parsed === undefined ||
    parsed === ""
  ) {
    return "—";
  }

  return String(parsed);
};

const getVendorLocation = (vendor) => {
  return normalizeLocation(
    vendor?.service_location ||
      vendor?.selected_place ||
      vendor?.location,
  );
};

const getApiErrorMessage = (
  error,
  fallbackMessage,
) => {
  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

function VendorSummaryCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="card vendor-summary-card">
      <div className="vendor-summary-icon">
        <Icon size={19} />
      </div>

      <div>
        <span>{label}</span>
        <b>{value}</b>
      </div>
    </div>
  );
}

function VendorStatusChip({ value }) {
  const status = String(
    value || "pending",
  ).toLowerCase();

  return (
    <em
      className={`status-chip ${status.replaceAll(
        "_",
        "-",
      )}`}
    >
      {status.replaceAll("_", " ")}
    </em>
  );
}

function BoundaryStatus({ vendor }) {
  const boundaryCount = normalizeBoundary(
    vendor?.service_boundary,
  ).length;

  const location =
    getVendorLocation(vendor);

  return (
    <div className="vendor-map-statuses">
      <span
        className={`vendor-boundary-status ${
          boundaryCount >= 3
            ? "configured"
            : "missing"
        }`}
      >
        <MapPinned size={13} />

        {boundaryCount >= 3
          ? `${boundaryCount} boundary points`
          : "No boundary"}
      </span>

      <span
        className={`vendor-location-status ${
          location ? "configured" : "missing"
        }`}
      >
        {location
          ? "Location pin saved"
          : "No location pin"}
      </span>
    </div>
  );
}

export default function AdminVendorsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vendors, setVendors] =
    useState([]);

  const [keyword, setKeyword] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    changingVendorId,
    setChangingVendorId,
  ] = useState(null);

  const loadVendors = async () => {
    setLoading(true);

    try {
      const response =
        await adminAPI.vendors({
          limit: 100,
        });

      setVendors(safeArray(response));
    } catch (error) {
      showToast(
        getApiErrorMessage(
          error,
          "Failed to load vendors",
        ),
        "error",
      );

      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    const query = keyword
      .trim()
      .toLowerCase();

    if (!query) {
      return vendors;
    }

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
        vendor.vat_number,
        formatCoverage(
          vendor.coverage_areas,
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [vendors, keyword]);

  const stats = useMemo(() => {
    return {
      total: vendors.length,

      active: vendors.filter(
        (vendor) =>
          vendor.status === "active",
      ).length,

      verified: vendors.filter(
        (vendor) =>
          vendor.verification_status ===
          "verified",
      ).length,

      boundaryConfigured: vendors.filter(
        (vendor) =>
          normalizeBoundary(
            vendor.service_boundary,
          ).length >= 3,
      ).length,

      locationConfigured: vendors.filter(
        (vendor) =>
          Boolean(getVendorLocation(vendor)),
      ).length,
    };
  }, [vendors]);

  const openCreateVendor = () => {
    navigate("/admin/vendors/create");
  };

  const openVendorDetails = (vendor) => {
    navigate(
      `/admin/vendors/${vendor.id}`,
    );
  };

  const openVendorEdit = (vendor) => {
    navigate(
      `/admin/vendors/${vendor.id}?mode=edit`,
    );
  };

  const verifyVendor = async (vendor) => {
    setChangingVendorId(vendor.id);

    try {
      await adminAPI.verifyVendor(
        vendor.id,
        "verified",
      );

      showToast(
        "Vendor verified successfully",
      );

      await loadVendors();
    } catch (error) {
      showToast(
        getApiErrorMessage(
          error,
          "Failed to verify vendor",
        ),
        "error",
      );
    } finally {
      setChangingVendorId(null);
    }
  };

  const updateStatus = async (
    vendor,
    status,
  ) => {
    setChangingVendorId(vendor.id);

    try {
      await adminAPI.updateVendorStatus(
        vendor.id,
        status,
      );

      showToast(
        status === "active"
          ? "Vendor activated successfully"
          : "Vendor suspended successfully",
      );

      await loadVendors();
    } catch (error) {
      showToast(
        getApiErrorMessage(
          error,
          "Failed to update vendor status",
        ),
        "error",
      );
    } finally {
      setChangingVendorId(null);
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
            width: 44px;
            height: 44px;
            flex: 0 0 auto;
            border-radius: 13px;
            display: grid;
            place-items: center;
            background: #edf4ff;
            color: #0a3a8d;
          }

          .admin-vendors-page .vendor-summary-card span {
            display: block;
            margin-bottom: 4px;
            color: #667297;
            font-size: 12px;
            font-weight: 800;
          }

          .admin-vendors-page .vendor-summary-card b {
            color: #07194f;
            font-size: 23px;
            font-weight: 950;
          }

          .admin-vendors-page .vendor-company-cell {
            min-width: 220px;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .admin-vendors-page .vendor-mini-logo {
            width: 44px;
            height: 44px;
            flex: 0 0 auto;
            overflow: hidden;
            border-radius: 12px;
            background: #07194f;
            color: #ffffff;
            display: grid;
            place-items: center;
            font-size: 17px;
            font-weight: 950;
          }

          .admin-vendors-page .vendor-mini-logo img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
          }

          .admin-vendors-page .vendor-company-cell b {
            display: block;
            color: #07194f;
            font-size: 13px;
            font-weight: 950;
          }

          .admin-vendors-page .vendor-company-cell small,
          .admin-vendors-page table td small {
            display: block;
            margin-top: 4px;
            color: #667297;
            font-size: 11px;
            line-height: 1.45;
            font-weight: 750;
          }

          .admin-vendors-page .vendor-map-statuses {
            margin-top: 7px;
            display: grid;
            justify-items: start;
            gap: 5px;
          }

          .admin-vendors-page .vendor-boundary-status,
          .admin-vendors-page .vendor-location-status {
            min-height: 25px;
            padding: 0 9px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 9px;
            font-weight: 900;
            white-space: nowrap;
          }

          .admin-vendors-page .vendor-boundary-status.configured,
          .admin-vendors-page .vendor-location-status.configured {
            border: 1px solid #b9e5c8;
            background: #eaf9ef;
            color: #11703b;
          }

          .admin-vendors-page .vendor-boundary-status.missing,
          .admin-vendors-page .vendor-location-status.missing {
            border: 1px solid #f1c5c8;
            background: #fff3f4;
            color: #b80d16;
          }

          .admin-vendors-page .vendor-list-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }

          .admin-vendors-page .vendor-list-head p {
            margin: 5px 0 0;
            color: #667297;
            font-size: 12px;
            line-height: 1.55;
            font-weight: 750;
          }

          .admin-vendors-page .vendor-loading-state {
            min-height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #667297;
            font-size: 13px;
            font-weight: 850;
          }

          .admin-vendors-page .row-actions {
            min-width: 250px;
          }

          .admin-vendors-page .row-actions-inner {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .admin-vendors-page .row-actions .tiny-btn {
            min-height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
          }

          .admin-vendors-page .tiny-btn.edit {
            border-color: #bdd2f2;
            background: #f2f7ff;
            color: #08459e;
          }

          .admin-vendors-page .tiny-btn.view {
            border-color: #d6deea;
            background: #ffffff;
            color: #07194f;
          }

          .admin-vendors-page .tiny-btn:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }

          @media (max-width: 760px) {
            .admin-vendors-page .vendor-list-head {
              align-items: stretch;
              flex-direction: column;
            }

            .admin-vendors-page .vendor-list-head .red-btn {
              width: 100%;
            }
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
            View, edit, verify and manage
            vendor accounts, saved location
            pins and operating boundaries.
          </p>
        </div>

        <div className="module-search">
          <input
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
            placeholder="Search company, contact, email, postcode..."
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
          label="Saved Boundaries"
          value={stats.boundaryConfigured}
          icon={MapPinned}
        />
      </div>

      <section className="card module-table">
        <div className="panel-head vendor-list-head">
          <div>
            <h2>Vendors List</h2>

            <p>
              {stats.locationConfigured} vendors
              have a saved location pin and{" "}
              {stats.boundaryConfigured} vendors
              have a configured service boundary.
            </p>
          </div>

          <button
            type="button"
            className="red-btn"
            onClick={openCreateVendor}
          >
            <Plus size={15} />
            Create Vendor
          </button>
        </div>

        <div className="table-scroll module-table-scroll">
          {loading ? (
            <div className="vendor-loading-state">
              Loading vendors...
            </div>
          ) : (
            <>
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
                  {filteredVendors.map(
                    (vendor) => (
                      <tr key={vendor.id}>
                        <td>
                          <div className="vendor-company-cell">
                            <div className="vendor-mini-logo">
                              {vendor.logo ? (
                                <img
                                  src={vendor.logo}
                                  alt={
                                    vendor.company_name
                                  }
                                  onError={(event) => {
                                    event.currentTarget.style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                String(
                                  vendor.company_name ||
                                    "V",
                                )
                                  .slice(0, 1)
                                  .toUpperCase()
                              )}
                            </div>

                            <div>
                              <b>
                                {vendor.company_name ||
                                  "Unnamed Vendor"}
                              </b>

                              <small>
                                VEN-{vendor.id}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <b>
                            {vendor.contact_person ||
                              "—"}
                          </b>

                          <small>
                            {vendor.email || "—"}
                          </small>

                          <small>
                            {vendor.mobile || "—"}
                          </small>
                        </td>

                        <td>
                          {vendor.company_registration_number ||
                            "—"}

                          <small>
                            VAT:{" "}
                            {vendor.vat_number ||
                              "—"}
                          </small>
                        </td>

                        <td>
                          <b>
                            {vendor.postcode || "—"}
                          </b>

                          <small>
                            {formatCoverage(
                              vendor.coverage_areas,
                            )}
                          </small>

                        
                        </td>

                        <td>
                          {Number(
                            vendor.years_experience ||
                              0,
                          )}{" "}
                          years

                          <small>
                            ★{" "}
                            {Number(
                              vendor.rating || 0,
                            ).toFixed(2)}{" "}
                            (
                            {Number(
                              vendor.total_reviews ||
                                0,
                            )}
                            )
                          </small>
                        </td>

                        <td>
                          Assigned:{" "}
                          {vendor.assigned_jobs || 0}

                          <small>
                            Quotes:{" "}
                            {vendor.submitted_quotes ||
                              0}
                          </small>

                          <small>
                            Won:{" "}
                            {vendor.won_jobs || 0}
                          </small>
                        </td>

                        <td>
                          <VendorStatusChip
                            value={vendor.status}
                          />
                        </td>

                        <td>
                          <VendorStatusChip
                            value={
                              vendor.verification_status
                            }
                          />
                        </td>

                        <td className="row-actions">
                          <div className="row-actions-inner">
                            <button
                              type="button"
                              className="tiny-btn view"
                              onClick={() =>
                                openVendorDetails(
                                  vendor,
                                )
                              }
                            >
                              <Eye size={13} />
                              View
                            </button>

                            <button
                              type="button"
                              className="tiny-btn edit"
                              onClick={() =>
                                openVendorEdit(
                                  vendor,
                                )
                              }
                            >
                              <Edit3 size={13} />
                              Edit
                            </button>

                            {vendor.verification_status !==
                            "verified" ? (
                              <button
                                type="button"
                                className="tiny-btn"
                                disabled={
                                  changingVendorId ===
                                  vendor.id
                                }
                                onClick={() =>
                                  verifyVendor(vendor)
                                }
                              >
                                Verify
                              </button>
                            ) : null}

                            {vendor.status ===
                            "suspended" ? (
                              <button
                                type="button"
                                className="tiny-btn"
                                disabled={
                                  changingVendorId ===
                                  vendor.id
                                }
                                onClick={() =>
                                  updateStatus(
                                    vendor,
                                    "active",
                                  )
                                }
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="tiny-btn red-text"
                                disabled={
                                  changingVendorId ===
                                  vendor.id
                                }
                                onClick={() =>
                                  updateStatus(
                                    vendor,
                                    "suspended",
                                  )
                                }
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>

              {!filteredVendors.length ? (
                <div className="empty-state">
                  No vendors found.
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}