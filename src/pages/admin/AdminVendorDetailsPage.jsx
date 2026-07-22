import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Edit3,
  FileText,
  KeyRound,
  LoaderCircle,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  RefreshCcw,
  Save,
  ShieldCheck,
  Star,
  Store,
  UserRound,
  X
} from "lucide-react";

import {
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";

import {
  adminAPI,
  formatDate
} from "../../services/api.js";

import {
  useToast
} from "../../components/ui/Toast.jsx";

import {
  FormGrid,
  SelectInput,
  TextArea,
  TextInput
} from "../../components/ui/Form.jsx";

import VendorBoundaryMap from "../../components/maps/VendorBoundaryMap.jsx";

const vendorStatusOptions = [
  {
    value: "pending",
    label: "Pending"
  },
  {
    value: "active",
    label: "Active"
  },
  {
    value: "suspended",
    label: "Suspended"
  },
  {
    value: "rejected",
    label: "Rejected"
  }
];

const verificationOptions = [
  {
    value: "pending",
    label: "Pending"
  },
  {
    value: "verified",
    label: "Verified"
  },
  {
    value: "rejected",
    label: "Rejected"
  }
];

const parseJsonValue = (
  value,
  fallback = null
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const normalizeCoverageAreas = (
  value
) => {
  const parsed = parseJsonValue(
    value,
    []
  );

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) =>
        String(item || "").trim()
      )
      .filter(Boolean);
  }

  if (typeof parsed === "string") {
    return parsed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const coverageToInput = (
  value
) => {
  return normalizeCoverageAreas(
    value
  ).join(", ");
};

const normalizeBoundary = (
  value
) => {
  const parsed = parseJsonValue(
    value,
    []
  );

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((point) => ({
      lat: Number(point?.lat),
      lng: Number(point?.lng)
    }))
    .filter(
      (point) =>
        Number.isFinite(point.lat) &&
        Number.isFinite(point.lng) &&
        point.lat >= -90 &&
        point.lat <= 90 &&
        point.lng >= -180 &&
        point.lng <= 180
    );
};

const normalizeLocation = (
  value
) => {
  const parsed = parseJsonValue(
    value,
    null
  );

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
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

    displayName:
      parsed.displayName ||
      parsed.name ||
      "Vendor location",

    formattedAddress:
      parsed.formattedAddress ||
      parsed.formatted_address ||
      parsed.address ||
      `${lat}, ${lng}`
  };
};

const deriveLocationFromBoundary = (
  boundary,
  vendor
) => {
  const points =
    normalizeBoundary(boundary);

  if (!points.length) {
    return null;
  }

  const totals = points.reduce(
    (result, point) => ({
      lat:
        result.lat + point.lat,

      lng:
        result.lng + point.lng
    }),
    {
      lat: 0,
      lng: 0
    }
  );

  const lat =
    totals.lat / points.length;

  const lng =
    totals.lng / points.length;

  return {
    placeId: null,

    displayName:
      vendor?.company_name
        ? `${vendor.company_name} boundary centre`
        : "Boundary centre",

    formattedAddress:
      vendor?.address ||
      vendor?.postcode ||
      "Location derived from the existing service boundary",

    postcode:
      vendor?.postcode || "",

    locality: "",
    administrativeArea: "",
    country: "",

    lat: Number(
      lat.toFixed(7)
    ),

    lng: Number(
      lng.toFixed(7)
    ),

    isDerived: true,
    isAdjusted: false,
    isManual: false
  };
};

const getExplicitLocation = (
  vendor
) => {
  return normalizeLocation(
    vendor?.service_location ||
      vendor?.selected_place ||
      vendor?.location
  );
};

const getDisplayLocation = (
  vendor
) => {
  return (
    getExplicitLocation(vendor) ||
    deriveLocationFromBoundary(
      vendor?.service_boundary,
      vendor
    )
  );
};

const toArray = (value) => {
  const parsed = parseJsonValue(
    value,
    []
  );

  return Array.isArray(parsed)
    ? parsed
    : [];
};

const parseCoverageInput = (
  value
) => {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const cleanText = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
};

const optionalDate = (value) => {
  return value
    ? formatDate(value)
    : "—";
};

const getApiErrorMessage = (
  error,
  fallback
) => {
  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
};

const unwrapVendorResponse = (
  response
) => {
  const root =
    response?.data?.data ??
    response?.data ??
    response ??
    {};

  const vendor =
    root?.vendor ||
    root;

  return {
    ...vendor,

    documents:
      root?.documents ||
      vendor?.documents ||
      [],

    quotes:
      root?.quotes ||
      vendor?.quotes ||
      []
  };
};

const createFormFromVendor = (
  vendor
) => {
  const boundary =
    normalizeBoundary(
      vendor?.service_boundary
    );

  const explicitLocation =
    getExplicitLocation(vendor);

  const displayLocation =
    explicitLocation ||
    deriveLocationFromBoundary(
      boundary,
      vendor
    );

  return {
    company_name:
      vendor?.company_name || "",

    contact_person:
      vendor?.contact_person || "",

    email:
      vendor?.email || "",

    mobile:
      vendor?.mobile || "",

    password: "",

    logo:
      vendor?.logo || "",

    company_registration_number:
      vendor?.company_registration_number ||
      "",

    vat_number:
      vendor?.vat_number || "",

    address:
      vendor?.address || "",

    postcode:
      vendor?.postcode || "",

    coverage_areas:
      coverageToInput(
        vendor?.coverage_areas
      ),

    service_location:
      displayLocation,

    service_boundary:
      boundary,

    insurance_details:
      vendor?.insurance_details ||
      "",

    years_experience:
      String(
        vendor?.years_experience ??
          0
      ),

    rating:
      String(
        vendor?.rating ?? 0
      ),

    total_reviews:
      String(
        vendor?.total_reviews ??
          0
      ),

    status:
      vendor?.status ||
      "pending",

    verification_status:
      vendor?.verification_status ||
      "pending"
  };
};

function StatusPill({ value }) {
  const status = String(
    value || "pending"
  )
    .toLowerCase()
    .replaceAll("_", "-");

  return (
    <span
      className={`vendor-status-pill ${status}`}
    >
      {String(
        value || "pending"
      ).replaceAll("_", " ")}
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children
}) {
  return (
    <section className="card vendor-section">
      <div className="vendor-section-header">
        <div className="vendor-section-icon">
          <Icon size={20} />
        </div>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="vendor-section-content">
        {children}
      </div>
    </section>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  wide = false
}) {
  return (
    <div
      className={`vendor-detail-item ${
        wide ? "wide" : ""
      }`}
    >
      <div className="vendor-detail-icon">
        <Icon size={17} />
      </div>

      <div>
        <span>{label}</span>
        <b>{value}</b>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  note
}) {
  return (
    <section className="card vendor-stat-card">
      <div className="vendor-stat-icon">
        <Icon size={19} />
      </div>

      <div>
        <span>{label}</span>
        <b>{value}</b>

        {note ? (
          <small>{note}</small>
        ) : null}
      </div>
    </section>
  );
}

export default function AdminVendorDetailsPage() {
  const navigate = useNavigate();

  const { vendorId } =
    useParams();

  const [
    searchParams,
    setSearchParams
  ] = useSearchParams();

  const { showToast } =
    useToast();

  const editing =
    searchParams.get("mode") ===
    "edit";

  const [vendor, setVendor] =
    useState(null);

  const [form, setForm] =
    useState(
      createFormFromVendor(null)
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const loadVendor = useCallback(
    async () => {
      if (!vendorId) {
        setLoading(false);

        setLoadError(
          "Vendor ID is missing"
        );

        return;
      }

      setLoading(true);
      setLoadError("");

      try {
        const response =
          await adminAPI.vendorById(
            vendorId
          );

        const vendorData =
          unwrapVendorResponse(
            response
          );

        if (!vendorData?.id) {
          throw new Error(
            "Vendor response is invalid"
          );
        }

        console.log(
          "Loaded vendor:",
          vendorData
        );

        console.log(
          "Coverage areas:",
          vendorData.coverage_areas
        );

        console.log(
          "Service boundary:",
          vendorData.service_boundary
        );

        console.log(
          "Service location:",
          vendorData.service_location
        );

        setVendor(vendorData);

        setForm(
          createFormFromVendor(
            vendorData
          )
        );
      } catch (error) {
        const message =
          getApiErrorMessage(
            error,
            "Vendor could not be loaded"
          );

        setLoadError(message);

        showToast(
          message,
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      vendorId,
      showToast
    ]
  );

  useEffect(() => {
    loadVendor();
  }, [loadVendor]);

  const updateForm = (
    key,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value
    }));
  };

  const handlePlaceSelect = (
    place
  ) => {
    if (!place) {
      setForm((previous) => ({
        ...previous,
        service_location: null
      }));

      return;
    }

    setForm((previous) => {
      const generatedCoverage = [
        place.locality,
        place.administrativeArea
      ]
        .filter(Boolean)
        .filter(
          (
            item,
            index,
            array
          ) =>
            array.indexOf(item) ===
            index
        )
        .join(", ");

      return {
        ...previous,

        service_location: {
          ...place,
          lat: Number(place.lat),
          lng: Number(place.lng),
          isDerived: false
        },

        address:
          place.formattedAddress ||
          previous.address,

        postcode:
          place.postcode
            ? String(
                place.postcode
              ).toUpperCase()
            : previous.postcode,

        coverage_areas:
          previous.coverage_areas.trim()
            ? previous.coverage_areas
            : generatedCoverage
      };
    });
  };

  const coverageAreas = useMemo(
    () =>
      normalizeCoverageAreas(
        vendor?.coverage_areas
      ),
    [vendor]
  );

  const savedBoundary = useMemo(
    () =>
      normalizeBoundary(
        vendor?.service_boundary
      ),
    [vendor]
  );

  const explicitLocation = useMemo(
    () =>
      getExplicitLocation(vendor),
    [vendor]
  );

  const savedDisplayLocation =
    useMemo(
      () =>
        getDisplayLocation(vendor),
      [vendor]
    );

  const editBoundary = useMemo(
    () =>
      normalizeBoundary(
        form.service_boundary
      ),
    [form.service_boundary]
  );

  const editLocation = useMemo(
    () =>
      normalizeLocation(
        form.service_location
      ),
    [form.service_location]
  );

  const documents = useMemo(
    () =>
      toArray(
        vendor?.documents
      ),
    [vendor]
  );

  const quotes = useMemo(
    () =>
      toArray(
        vendor?.quotes
      ),
    [vendor]
  );

  const beginEditing = () => {
    setForm(
      createFormFromVendor(vendor)
    );

    setSearchParams({
      mode: "edit"
    });
  };

  const cancelEditing = () => {
    if (saving) {
      return;
    }

    setForm(
      createFormFromVendor(vendor)
    );

    setSearchParams({});
  };

  const validateForm = () => {
    if (
      !form.company_name.trim()
    ) {
      showToast(
        "Company name is required",
        "error"
      );

      return false;
    }

    if (
      !form.contact_person.trim()
    ) {
      showToast(
        "Contact person is required",
        "error"
      );

      return false;
    }

    if (!form.email.trim()) {
      showToast(
        "Email is required",
        "error"
      );

      return false;
    }

    if (!form.mobile.trim()) {
      showToast(
        "Mobile number is required",
        "error"
      );

      return false;
    }

    if (!editLocation) {
      showToast(
        "Search or manually place the vendor location pin",
        "error"
      );

      return false;
    }

    if (
      editBoundary.length < 3
    ) {
      showToast(
        "The service boundary must have at least three points",
        "error"
      );

      return false;
    }

    const experience = Number(
      form.years_experience
    );

    if (
      !Number.isFinite(experience) ||
      experience < 0
    ) {
      showToast(
        "Years of experience must be zero or greater",
        "error"
      );

      return false;
    }

    const rating = Number(
      form.rating
    );

    if (
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 5
    ) {
      showToast(
        "Rating must be between 0 and 5",
        "error"
      );

      return false;
    }

    if (
      form.password &&
      form.password.length < 8
    ) {
      showToast(
        "The new password must have at least 8 characters",
        "error"
      );

      return false;
    }

    return true;
  };

  const saveVendor = async (
    event
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        company_name:
          form.company_name.trim(),

        contact_person:
          form.contact_person.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        mobile:
          form.mobile.trim(),

        logo:
          form.logo.trim() ||
          null,

        company_registration_number:
          form.company_registration_number
            .trim() || null,

        vat_number:
          form.vat_number.trim() ||
          null,

        address:
          form.address.trim() ||
          null,

        postcode:
          form.postcode
            .trim()
            .toUpperCase() ||
          null,

        coverage_areas:
          parseCoverageInput(
            form.coverage_areas
          ),

        service_location: {
          ...editLocation,
          isDerived: false
        },

        service_boundary:
          editBoundary,

        insurance_details:
          form.insurance_details
            .trim() || null,

        years_experience:
          Number(
            form.years_experience ||
              0
          ),

        rating:
          Number(
            form.rating || 0
          ),

        total_reviews:
          Number(
            form.total_reviews ||
              0
          ),

        status:
          form.status,

        verification_status:
          form.verification_status
      };

      if (
        form.password.trim()
      ) {
        payload.password =
          form.password;
      }

      await adminAPI.updateVendor(
        vendorId,
        payload
      );

      showToast(
        "Vendor updated successfully"
      );

      setSearchParams({});

      await loadVendor();
    } catch (error) {
      showToast(
        getApiErrorMessage(
          error,
          "Failed to update vendor"
        ),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="module-page vendor-details-page">
        <div className="card vendor-page-message">
          <LoaderCircle
            size={24}
            className="vendor-spinner"
          />

          Loading vendor details...
        </div>
      </div>
    );
  }

  if (
    loadError ||
    !vendor
  ) {
    return (
      <div className="module-page vendor-details-page">
        <div className="card vendor-page-message">
          <Store size={32} />

          <h2>
            Vendor could not be loaded
          </h2>

          <p>
            {loadError}
          </p>

          <div className="vendor-message-actions">
            <button
              type="button"
              className="outline-btn"
              onClick={() =>
                navigate(
                  "/admin/vendors"
                )
              }
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <button
              type="button"
              className="red-btn"
              onClick={loadVendor}
            >
              <RefreshCcw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page vendor-details-page">
      <style>
        {`
          .vendor-details-page {
            padding-bottom: 0;
          }

          .vendor-details-page .vendor-spinner {
            animation: vendor-spin 0.8s linear infinite;
          }

          .vendor-details-page .vendor-page-message {
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 12px;
            text-align: center;
            color: #667297;
            font-size: 13px;
            font-weight: 800;
          }

          .vendor-details-page .vendor-page-message h2 {
            margin: 0;
            color: #07194f;
          }

          .vendor-details-page .vendor-page-message p {
            margin: 0;
          }

          .vendor-details-page .vendor-message-actions {
            display: flex;
            gap: 10px;
          }

          .vendor-details-page .vendor-header {
            min-height: 120px;
            padding: 22px;
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .vendor-details-page .vendor-back {
            width: 42px;
            height: 42px;
            flex: 0 0 auto;
            border: 1px solid #d7e1ef;
            border-radius: 11px;
            background: #ffffff;
            color: #005eff;
            display: grid;
            place-items: center;
            cursor: pointer;
          }

          .vendor-details-page .vendor-logo {
            width: 60px;
            height: 60px;
            flex: 0 0 auto;
            border-radius: 16px;
            overflow: hidden;
            background: #07194f;
            color: #ffffff;
            display: grid;
            place-items: center;
            font-size: 23px;
            font-weight: 950;
          }

          .vendor-details-page .vendor-logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .vendor-details-page .vendor-header-content {
            min-width: 0;
            flex: 1;
          }

          .vendor-details-page .vendor-header-content small {
            color: #005eff;
            font-size: 10px;
            font-weight: 950;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .vendor-details-page .vendor-header-content h1 {
            margin: 5px 0 0;
            color: #07194f;
            font-size: 24px;
            font-weight: 950;
          }

          .vendor-details-page .vendor-header-content p {
            margin: 6px 0 0;
            color: #667297;
            font-size: 12px;
            font-weight: 750;
          }

          .vendor-details-page .vendor-header-statuses {
            margin-top: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
          }

          .vendor-details-page .vendor-status-pill {
            min-height: 29px;
            padding: 0 11px;
            border-radius: 999px;
            border: 1px solid #d9e2ef;
            background: #f7f9fd;
            color: #667297;
            display: inline-flex;
            align-items: center;
            font-size: 10px;
            font-weight: 950;
            text-transform: capitalize;
          }

          .vendor-details-page .vendor-status-pill.active,
          .vendor-details-page .vendor-status-pill.verified,
          .vendor-details-page .vendor-status-pill.configured {
            border-color: #b8e5c8;
            background: #eaf9ef;
            color: #11703b;
          }

          .vendor-details-page .vendor-status-pill.pending,
          .vendor-details-page .vendor-status-pill.derived {
            border-color: #efd59e;
            background: #fff8e7;
            color: #99640b;
          }

          .vendor-details-page .vendor-status-pill.suspended,
          .vendor-details-page .vendor-status-pill.rejected,
          .vendor-details-page .vendor-status-pill.missing {
            border-color: #f1c3c6;
            background: #fff1f2;
            color: #b80d16;
          }

          .vendor-details-page .vendor-header-actions {
            display: flex;
            gap: 10px;
          }

          .vendor-details-page .vendor-header-actions button {
            min-height: 44px;
            padding: 0 21px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 12px;
            font-weight: 950;
          }

          .vendor-details-page .vendor-stats {
            margin-top: 18px;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          .vendor-details-page .vendor-stat-card {
            min-height: 95px;
            display: flex;
            align-items: center;
            gap: 13px;
          }

          .vendor-details-page .vendor-stat-icon {
            width: 43px;
            height: 43px;
            border-radius: 12px;
            background: #edf4ff;
            color: #0a3a8d;
            display: grid;
            place-items: center;
          }

          .vendor-details-page .vendor-stat-card span {
            display: block;
            color: #667297;
            font-size: 11px;
            font-weight: 850;
          }

          .vendor-details-page .vendor-stat-card b {
            display: block;
            margin-top: 3px;
            color: #07194f;
            font-size: 21px;
            font-weight: 950;
          }

          .vendor-details-page .vendor-stat-card small {
            color: #667297;
            font-size: 10px;
            font-weight: 750;
          }

          .vendor-details-page .vendor-layout {
            margin-top: 18px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 320px;
            align-items: start;
            gap: 18px;
          }

          .vendor-details-page .vendor-main {
            min-width: 0;
          }

          .vendor-details-page .vendor-sidebar {
            position: sticky;
            top: 18px;
            display: grid;
            gap: 18px;
          }

          .vendor-details-page .vendor-section {
            padding: 0;
            margin-bottom: 18px;
            overflow: visible;
          }

          .vendor-details-page .vendor-section-header {
            min-height: 76px;
            padding: 17px 19px;
            border-bottom: 1px solid #e0e7f1;
            background: #fbfcff;
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }

          .vendor-details-page .vendor-section-icon {
            width: 38px;
            height: 38px;
            flex: 0 0 auto;
            border-radius: 11px;
            background: #eaf2ff;
            color: #0a3a8d;
            display: grid;
            place-items: center;
          }

          .vendor-details-page .vendor-section-header h2 {
            margin: 0;
            color: #07194f;
            font-size: 16px;
            font-weight: 950;
          }

          .vendor-details-page .vendor-section-header p {
            margin: 4px 0 0;
            color: #667297;
            font-size: 12px;
            line-height: 1.55;
            font-weight: 750;
          }

          .vendor-details-page .vendor-section-content {
            padding: 20px;
          }

          .vendor-details-page .vendor-detail-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .vendor-details-page .vendor-detail-item {
            min-height: 76px;
            padding: 13px;
            border: 1px solid #e0e7f1;
            border-radius: 10px;
            background: #fbfcff;
            display: flex;
            align-items: flex-start;
            gap: 11px;
          }

          .vendor-details-page .vendor-detail-item.wide {
            grid-column: 1 / -1;
          }

          .vendor-details-page .vendor-detail-icon {
            width: 34px;
            height: 34px;
            flex: 0 0 auto;
            border-radius: 9px;
            background: #eef4ff;
            color: #0a3a8d;
            display: grid;
            place-items: center;
          }

          .vendor-details-page .vendor-detail-item span {
            display: block;
            color: #667297;
            font-size: 10px;
            font-weight: 850;
          }

          .vendor-details-page .vendor-detail-item b {
            display: block;
            margin-top: 5px;
            color: #07194f;
            font-size: 12px;
            line-height: 1.55;
            font-weight: 900;
            word-break: break-word;
          }

          .vendor-details-page .vendor-map-summary {
            margin-bottom: 15px;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .vendor-details-page .vendor-map-summary > div {
            min-height: 68px;
            padding: 12px;
            border: 1px solid #dce5f2;
            border-radius: 10px;
            background: #f7faff;
          }

          .vendor-details-page .vendor-map-summary span {
            display: block;
            color: #667297;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
          }

          .vendor-details-page .vendor-map-summary b {
            display: block;
            margin-top: 5px;
            color: #07194f;
            font-size: 11px;
            line-height: 1.5;
            font-weight: 900;
            word-break: break-word;
          }

          .vendor-details-page .vendor-help {
            margin: 12px 0 0;
            color: #667297;
            font-size: 11px;
            line-height: 1.65;
            font-weight: 750;
          }

          .vendor-details-page .vendor-help strong {
            color: #07194f;
          }

          .vendor-details-page .vendor-sidebar-card {
            padding: 18px;
          }

          .vendor-details-page .vendor-sidebar-card h3 {
            margin: 0;
            color: #07194f;
            font-size: 15px;
            font-weight: 950;
          }

          .vendor-details-page .vendor-sidebar-card p {
            margin: 6px 0 0;
            color: #667297;
            font-size: 11px;
            line-height: 1.6;
            font-weight: 750;
          }

          .vendor-details-page .vendor-sidebar-list {
            margin-top: 15px;
            display: grid;
            gap: 10px;
          }

          .vendor-details-page .vendor-sidebar-row {
            min-height: 41px;
            padding: 9px 10px;
            border: 1px solid #e1e7f0;
            border-radius: 9px;
            background: #fbfcff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .vendor-details-page .vendor-sidebar-row span {
            color: #667297;
            font-size: 10px;
            font-weight: 850;
          }

          .vendor-details-page .vendor-sidebar-row b {
            max-width: 175px;
            color: #07194f;
            font-size: 10px;
            font-weight: 950;
            text-align: right;
            word-break: break-word;
          }

          .vendor-details-page .vendor-save-bar {
            position: sticky;
            bottom: 0;
            z-index: 40;
            min-height: 76px;
            padding: 14px 18px;
            border-top: 1px solid #dce5f3;
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(14px);
            box-shadow: 0 -12px 34px rgba(7, 25, 79, 0.09);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
          }

          .vendor-details-page .vendor-save-message {
            color: #11703b;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            font-weight: 850;
          }

          .vendor-details-page .vendor-save-actions {
            display: flex;
            gap: 11px;
          }

          .vendor-details-page .vendor-save-actions button {
            min-height: 44px;
            padding: 0 24px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            font-size: 12px;
            font-weight: 950;
          }

          .vendor-details-page .vendor-table-empty {
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #667297;
            font-size: 12px;
            font-weight: 800;
          }

          @keyframes vendor-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 1120px) {
            .vendor-details-page .vendor-layout {
              grid-template-columns: 1fr;
            }

            .vendor-details-page .vendor-sidebar {
              position: static;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 800px) {
            .vendor-details-page .vendor-header {
              flex-wrap: wrap;
              align-items: flex-start;
            }

            .vendor-details-page .vendor-header-actions {
              width: 100%;
            }

            .vendor-details-page .vendor-stats,
            .vendor-details-page .vendor-map-summary {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .vendor-details-page .vendor-sidebar {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 600px) {
            .vendor-details-page .vendor-logo {
              display: none;
            }

            .vendor-details-page .vendor-stats,
            .vendor-details-page .vendor-map-summary,
            .vendor-details-page .vendor-detail-grid {
              grid-template-columns: 1fr;
            }

            .vendor-details-page .vendor-detail-item.wide {
              grid-column: auto;
            }

            .vendor-details-page .vendor-header-actions button,
            .vendor-details-page .vendor-save-actions button {
              width: 100%;
            }

            .vendor-details-page .vendor-save-bar {
              align-items: stretch;
              flex-direction: column;
            }

            .vendor-details-page .vendor-save-actions {
              flex-direction: column-reverse;
            }
          }
        `}
      </style>

      <section className="card vendor-header">
        <button
          type="button"
          className="vendor-back"
          onClick={() =>
            navigate(
              "/admin/vendors"
            )
          }
          disabled={saving}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="vendor-logo">
          {vendor.logo ? (
            <img
              src={vendor.logo}
              alt={vendor.company_name}
            />
          ) : (
            String(
              vendor.company_name ||
                "V"
            )
              .slice(0, 1)
              .toUpperCase()
          )}
        </div>

        <div className="vendor-header-content">
          <small>
            Vendor VEN-{vendor.id}
          </small>

          <h1>
            {vendor.company_name}
          </h1>

          <p>
            {editing
              ? "Edit the complete vendor account, location pin and service boundary."
              : "Complete vendor account, operational and map information."}
          </p>

          <div className="vendor-header-statuses">
            <StatusPill
              value={vendor.status}
            />

            <StatusPill
              value={
                vendor.verification_status
              }
            />

            <StatusPill
              value={
                explicitLocation
                  ? "configured"
                  : savedDisplayLocation
                    ? "derived"
                    : "missing"
              }
            />

            <StatusPill
              value={
                savedBoundary.length >= 3
                  ? "configured"
                  : "missing"
              }
            />
          </div>
        </div>

        <div className="vendor-header-actions">
          {editing ? (
            <button
              type="button"
              className="outline-btn"
              onClick={cancelEditing}
              disabled={saving}
            >
              <X size={16} />
              Cancel Editing
            </button>
          ) : (
            <button
              type="button"
              className="red-btn"
              onClick={beginEditing}
            >
              <Edit3 size={16} />
              Edit Vendor
            </button>
          )}
        </div>
      </section>

      <div className="vendor-stats">
        <StatCard
          icon={BriefcaseBusiness}
          label="Assigned Jobs"
          value={
            vendor.assigned_jobs ||
            0
          }
        />

        <StatCard
          icon={FileText}
          label="Submitted Quotes"
          value={
            vendor.submitted_quotes ||
            0
          }
        />

        <StatCard
          icon={CheckCircle2}
          label="Won Jobs"
          value={
            vendor.won_jobs || 0
          }
        />

        <StatCard
          icon={Star}
          label="Rating"
          value={Number(
            vendor.rating || 0
          ).toFixed(2)}
          note={`${vendor.total_reviews || 0} reviews`}
        />
      </div>

      {editing ? (
        <form onSubmit={saveVendor}>
          <div className="vendor-layout">
            <main className="vendor-main">
              <Section
                icon={Building2}
                title="Company Information"
                description="Update company and vendor contact information."
              >
                <FormGrid>
                  <TextInput
                    label="Company Name"
                    value={
                      form.company_name
                    }
                    onChange={(value) =>
                      updateForm(
                        "company_name",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Contact Person"
                    value={
                      form.contact_person
                    }
                    onChange={(value) =>
                      updateForm(
                        "contact_person",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      updateForm(
                        "email",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Mobile"
                    value={form.mobile}
                    onChange={(value) =>
                      updateForm(
                        "mobile",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Logo URL"
                    value={form.logo}
                    onChange={(value) =>
                      updateForm(
                        "logo",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="New Password"
                    type="password"
                    value={form.password}
                    onChange={(value) =>
                      updateForm(
                        "password",
                        value
                      )
                    }
                    placeholder="Leave empty to keep current password"
                  />
                </FormGrid>
              </Section>

              <Section
                icon={FileText}
                title="Registration Details"
                description="Update registration and performance details."
              >
                <FormGrid>
                  <TextInput
                    label="Company Registration Number"
                    value={
                      form.company_registration_number
                    }
                    onChange={(value) =>
                      updateForm(
                        "company_registration_number",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="VAT Number"
                    value={
                      form.vat_number
                    }
                    onChange={(value) =>
                      updateForm(
                        "vat_number",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Years Experience"
                    type="number"
                    value={
                      form.years_experience
                    }
                    onChange={(value) =>
                      updateForm(
                        "years_experience",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Rating"
                    type="number"
                    value={form.rating}
                    onChange={(value) =>
                      updateForm(
                        "rating",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Total Reviews"
                    type="number"
                    value={
                      form.total_reviews
                    }
                    onChange={(value) =>
                      updateForm(
                        "total_reviews",
                        value
                      )
                    }
                  />
                </FormGrid>
              </Section>

              <Section
                icon={MapPin}
                title="Location & Coverage"
                description="Update address, postcode and readable coverage areas."
              >
                <FormGrid>
                  <TextInput
                    label="Postcode"
                    value={
                      form.postcode
                    }
                    onChange={(value) =>
                      updateForm(
                        "postcode",
                        value
                      )
                    }
                  />

                  <TextInput
                    label="Coverage Areas"
                    value={
                      form.coverage_areas
                    }
                    onChange={(value) =>
                      updateForm(
                        "coverage_areas",
                        value
                      )
                    }
                    placeholder="Luton, England"
                  />
                </FormGrid>

                <TextArea
                  label="Registered / Office Address"
                  value={form.address}
                  onChange={(value) =>
                    updateForm(
                      "address",
                      value
                    )
                  }
                />
              </Section>

              <Section
                icon={MapPinned}
                title="Location Pin & Service Boundary"
                description="The existing boundary and location are loaded automatically."
              >
                <VendorBoundaryMap
                  value={
                    form.service_boundary
                  }
                  onChange={(value) =>
                    updateForm(
                      "service_boundary",
                      value
                    )
                  }
                  locationValue={
                    form.service_location
                  }
                  onPlaceSelect={
                    handlePlaceSelect
                  }
                  postcode={
                    form.postcode
                  }
                  height={520}
                />

                <p className="vendor-help">
                  {!explicitLocation &&
                  savedBoundary.length >= 3 ? (
                    <>
                      <strong>
                        This vendor did not
                        previously have a saved
                        location pin.
                      </strong>{" "}
                      A temporary pin has been
                      placed at the centre of the
                      existing boundary. Drag it
                      to the exact office location
                      and save the vendor.
                    </>
                  ) : (
                    <>
                      The saved location pin and
                      all existing boundary points
                      are shown. The pin can be
                      dragged without removing the
                      existing boundary.
                    </>
                  )}
                </p>
              </Section>

              <Section
                icon={ShieldCheck}
                title="Insurance & Status"
                description="Update insurance and vendor account status."
              >
                <TextArea
                  label="Insurance Details"
                  value={
                    form.insurance_details
                  }
                  onChange={(value) =>
                    updateForm(
                      "insurance_details",
                      value
                    )
                  }
                />

                <FormGrid>
                  <SelectInput
                    label="Account Status"
                    value={form.status}
                    onChange={(value) =>
                      updateForm(
                        "status",
                        value
                      )
                    }
                    options={
                      vendorStatusOptions
                    }
                  />

                  <SelectInput
                    label="Verification Status"
                    value={
                      form.verification_status
                    }
                    onChange={(value) =>
                      updateForm(
                        "verification_status",
                        value
                      )
                    }
                    options={
                      verificationOptions
                    }
                  />
                </FormGrid>
              </Section>
            </main>

            <aside className="vendor-sidebar">
              <section className="card vendor-sidebar-card">
                <h3>Edit Summary</h3>

                <p>
                  Review the existing coverage
                  and map information.
                </p>

                <div className="vendor-sidebar-list">
                  <div className="vendor-sidebar-row">
                    <span>Coverage</span>

                    <b>
                      {form.coverage_areas ||
                        "Not entered"}
                    </b>
                  </div>

                  <div className="vendor-sidebar-row">
                    <span>Location</span>

                    <b>
                      {editLocation
                        ? editLocation.isDerived
                          ? "Derived from boundary"
                          : "Configured"
                        : "Missing"}
                    </b>
                  </div>

                  <div className="vendor-sidebar-row">
                    <span>Coordinates</span>

                    <b>
                      {editLocation
                        ? `${editLocation.lat.toFixed(
                            5
                          )}, ${editLocation.lng.toFixed(
                            5
                          )}`
                        : "Missing"}
                    </b>
                  </div>

                  <div className="vendor-sidebar-row">
                    <span>Boundary</span>

                    <b>
                      {editBoundary.length}{" "}
                      points
                    </b>
                  </div>

                  <div className="vendor-sidebar-row">
                    <span>Status</span>

                    <b>
                      {form.status}
                    </b>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          <div className="vendor-save-bar">
            <div className="vendor-save-message">
              <CheckCircle2 size={17} />
              Save company, coverage, pin and boundary changes together.
            </div>

            <div className="vendor-save-actions">
              <button
                type="button"
                className="outline-btn"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="red-btn"
                disabled={saving}
              >
                <Save size={16} />

                {saving
                  ? "Saving Vendor..."
                  : "Save Vendor Changes"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="vendor-layout">
          <main className="vendor-main">
            <Section
              icon={Building2}
              title="Company Information"
              description="Complete vendor account and contact details."
            >
              <div className="vendor-detail-grid">
                <DetailItem
                  icon={Store}
                  label="Company Name"
                  value={cleanText(
                    vendor.company_name
                  )}
                />

                <DetailItem
                  icon={UserRound}
                  label="Contact Person"
                  value={cleanText(
                    vendor.contact_person
                  )}
                />

                <DetailItem
                  icon={Mail}
                  label="Email"
                  value={cleanText(
                    vendor.email
                  )}
                />

                <DetailItem
                  icon={Phone}
                  label="Mobile"
                  value={cleanText(
                    vendor.mobile
                  )}
                />

                <DetailItem
                  icon={Building2}
                  label="Registration Number"
                  value={cleanText(
                    vendor.company_registration_number
                  )}
                />

                <DetailItem
                  icon={FileText}
                  label="VAT Number"
                  value={cleanText(
                    vendor.vat_number
                  )}
                />
              </div>
            </Section>

            <Section
              icon={MapPinned}
              title="Location & Service Boundary"
              description="Saved coverage areas, location pin and geographical operating boundary."
            >
              <div className="vendor-map-summary">
                <div>
                  <span>
                    Office Address
                  </span>

                  <b>
                    {cleanText(
                      vendor.address
                    )}
                  </b>
                </div>

                <div>
                  <span>Postcode</span>

                  <b>
                    {cleanText(
                      vendor.postcode
                    )}
                  </b>
                </div>

                <div>
                  <span>
                    Coverage Areas
                  </span>

                  <b>
                    {coverageAreas.length
                      ? coverageAreas.join(
                          ", "
                        )
                      : "Not configured"}
                  </b>
                </div>

                <div>
                  <span>
                    Location Pin
                  </span>

                  <b>
                    {explicitLocation
                      ? explicitLocation.displayName
                      : savedDisplayLocation
                        ? "Derived from boundary"
                        : "Not configured"}
                  </b>
                </div>

                <div>
                  <span>
                    Coordinates
                  </span>

                  <b>
                    {savedDisplayLocation
                      ? `${savedDisplayLocation.lat.toFixed(
                          6
                        )}, ${savedDisplayLocation.lng.toFixed(
                          6
                        )}`
                      : "Not configured"}
                  </b>
                </div>

                <div>
                  <span>
                    Boundary Points
                  </span>

                  <b>
                    {savedBoundary.length >= 3
                      ? `${savedBoundary.length} points`
                      : "Not configured"}
                  </b>
                </div>
              </div>

              {savedBoundary.length ||
              savedDisplayLocation ? (
                <VendorBoundaryMap
                  value={
                    savedBoundary
                  }
                  locationValue={
                    savedDisplayLocation
                  }
                  postcode={
                    vendor.postcode ||
                    ""
                  }
                  readOnly
                  height={480}
                />
              ) : (
                <div className="vendor-table-empty">
                  No map information has been configured.
                </div>
              )}

              {!explicitLocation &&
              savedBoundary.length >= 3 ? (
                <p className="vendor-help">
                  <strong>
                    Location pin is currently
                    derived from the centre of
                    the existing boundary.
                  </strong>{" "}
                  Open Edit Vendor, drag the pin
                  to the exact office location
                  and save it.
                </p>
              ) : null}
            </Section>

            <Section
              icon={ShieldCheck}
              title="Insurance & Account"
              description="Vendor insurance, status and performance details."
            >
              <div className="vendor-detail-grid">
                <DetailItem
                  icon={ShieldCheck}
                  label="Insurance Details"
                  value={cleanText(
                    vendor.insurance_details
                  )}
                  wide
                />

                <DetailItem
                  icon={BriefcaseBusiness}
                  label="Years Experience"
                  value={`${Number(
                    vendor.years_experience ||
                      0
                  )} years`}
                />

                <DetailItem
                  icon={Star}
                  label="Rating"
                  value={`${Number(
                    vendor.rating || 0
                  ).toFixed(2)} / 5`}
                />

                <DetailItem
                  icon={BadgeCheck}
                  label="Account Status"
                  value={
                    <StatusPill
                      value={
                        vendor.status
                      }
                    />
                  }
                />

                <DetailItem
                  icon={CheckCircle2}
                  label="Verification"
                  value={
                    <StatusPill
                      value={
                        vendor.verification_status
                      }
                    />
                  }
                />
              </div>
            </Section>

            <Section
              icon={FileText}
              title="Vendor Documents"
              description="Uploaded vendor verification documents."
            >
              {documents.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Uploaded</th>
                      </tr>
                    </thead>

                    <tbody>
                      {documents.map(
                        (
                          document,
                          index
                        ) => (
                          <tr
                            key={
                              document.id ||
                              index
                            }
                          >
                            <td>
                              {document.file_name ||
                                document.document_name ||
                                document.name ||
                                `Document ${
                                  index + 1
                                }`}
                            </td>

                            <td>
                              {document.document_type ||
                                document.type ||
                                "—"}
                            </td>

                            <td>
                              {document.status ||
                                "pending"}
                            </td>

                            <td>
                              {optionalDate(
                                document.created_at
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="vendor-table-empty">
                  No documents uploaded.
                </div>
              )}
            </Section>

            <Section
              icon={BriefcaseBusiness}
              title="Vendor Quotes"
              description="Quotes submitted by this vendor."
            >
              {quotes.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Quote</th>
                        <th>Job</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>

                    <tbody>
                      {quotes.map(
                        (
                          quote,
                          index
                        ) => (
                          <tr
                            key={
                              quote.id ||
                              index
                            }
                          >
                            <td>
                              QUO-
                              {quote.id ||
                                index + 1}
                            </td>

                            <td>
                              {quote.job_id ||
                                quote.move_id ||
                                "—"}
                            </td>

                            <td>
                              {quote.amount ??
                              quote.price ??
                              null
                                ? `£${Number(
                                    quote.amount ??
                                      quote.price
                                  ).toFixed(
                                    2
                                  )}`
                                : "—"}
                            </td>

                            <td>
                              {quote.status ||
                                "pending"}
                            </td>

                            <td>
                              {optionalDate(
                                quote.created_at
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="vendor-table-empty">
                  No quotes submitted.
                </div>
              )}
            </Section>
          </main>

          <aside className="vendor-sidebar">
            <section className="card vendor-sidebar-card">
              <h3>Vendor Record</h3>

              <p>
                Database and map configuration information.
              </p>

              <div className="vendor-sidebar-list">
                <div className="vendor-sidebar-row">
                  <span>Vendor ID</span>
                  <b>VEN-{vendor.id}</b>
                </div>

                <div className="vendor-sidebar-row">
                  <span>Coverage Areas</span>

                  <b>
                    {coverageAreas.length}
                  </b>
                </div>

                <div className="vendor-sidebar-row">
                  <span>Boundary Points</span>

                  <b>
                    {savedBoundary.length}
                  </b>
                </div>

                <div className="vendor-sidebar-row">
                  <span>Location</span>

                  <b>
                    {explicitLocation
                      ? "Saved"
                      : savedDisplayLocation
                        ? "Derived"
                        : "Missing"}
                  </b>
                </div>

                <div className="vendor-sidebar-row">
                  <span>Boundary Updated</span>

                  <b>
                    {optionalDate(
                      vendor.boundary_updated_at
                    )}
                  </b>
                </div>

                <div className="vendor-sidebar-row">
                  <span>Created</span>

                  <b>
                    {optionalDate(
                      vendor.created_at
                    )}
                  </b>
                </div>

                <div className="vendor-sidebar-row">
                  <span>Updated</span>

                  <b>
                    {optionalDate(
                      vendor.updated_at
                    )}
                  </b>
                </div>
              </div>
            </section>

            <section className="card vendor-sidebar-card">
              <h3>Authentication</h3>

              <p>
                Password hashes and access tokens are intentionally hidden.
              </p>

              <div className="vendor-sidebar-list">
                <div className="vendor-sidebar-row">
                  <span>Last Login</span>

                  <b>
                    {optionalDate(
                      vendor.last_login_at
                    )}
                  </b>
                </div>

                <div className="vendor-sidebar-row">
                  <span>Password</span>

                  <b>
                    Securely stored
                  </b>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}