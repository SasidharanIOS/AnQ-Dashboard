import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:7070/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/*
 * Adds the logged-in user's token to every API request.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "anq_token",
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/*
 * Keeps backend error information available while also
 * returning a readable JavaScript Error.
 */
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";

    const normalizedError =
      error instanceof Error
        ? error
        : new Error(message);

    normalizedError.message = message;
    normalizedError.response =
      error?.response;
    normalizedError.data =
      error?.response?.data;
    normalizedError.status =
      error?.response?.status;

    return Promise.reject(
      normalizedError,
    );
  },
);

/*
 * Extracts the actual API data from an Axios response.
 *
 * Supported responses:
 *
 * {
 *   error: false,
 *   data: [...]
 * }
 *
 * {
 *   error: false,
 *   data: {...}
 * }
 */
export const unwrap = (response) => {
  return (
    response?.data?.data ??
    response?.data ??
    response
  );
};

/*
 * Safely converts a response into an array.
 */
export const safeArray = (value) => {
  const data = unwrap(value);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [];
};

/*
 * Validates and safely encodes route IDs.
 */
const requireId = (
  value,
  label = "ID",
) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(
      `${label} is required`,
    );
  }

  return encodeURIComponent(
    String(value).trim(),
  );
};

export const money = (
  value,
  currency = "GBP",
) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency,
    },
  ).format(amount);
};

export const formatDate = (
  value,
) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

/* ======================================================
   AUTH APIs
====================================================== */

export const authAPI = {
  login: async (
    role,
    payload,
  ) => {
    const response =
      await api.post(
        `/${role}/auth/login`,
        payload,
      );

    return response.data;
  },

  registerCustomer: async (
    payload,
  ) => {
    const response =
      await api.post(
        "/customer/auth/register",
        payload,
      );

    return response.data;
  },

  registerVendor: async (
    payload,
  ) => {
    const response =
      await api.post(
        "/vendor/auth/register",
        payload,
      );

    return response.data;
  },

  googleCustomerLogin: async (
    credential,
  ) => {
    const response =
      await api.post(
        "/customer/auth/google",
        {
          credential,
        },
      );

    return response.data;
  },

  profile: async (role) => {
    const response =
      await api.get(
        `/${role}/auth/profile`,
      );

    return unwrap(response);
  },

  updateProfile: async (
    role,
    payload,
  ) => {
    const response =
      await api.put(
        `/${role}/auth/profile`,
        payload,
      );

    return unwrap(response);
  },

  createCustomerPassword:
    async (payload) => {
      const response =
        await api.put(
          "/customer/auth/create-password",
          payload,
        );

      return unwrap(response);
    },
};

/* ======================================================
   CUSTOMER APIs
====================================================== */

export const customerAPI = {
  moves: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/customer/moves",
        {
          params,
        },
      );

    return unwrap(response);
  },

  createMove: async (
    payload,
  ) => {
    const response =
      await api.post(
        "/customer/moves",
        payload,
      );

    return unwrap(response);
  },

  cancelMove: async (id) => {
    const moveId = requireId(
      id,
      "Move ID",
    );

    const response =
      await api.put(
        `/customer/moves/${moveId}/cancel`,
      );

    return unwrap(response);
  },

  updateMoveProfile: async (
    moveRequestId,
    payload,
  ) => {
    const moveId = requireId(
      moveRequestId,
      "Move request ID",
    );

    const response =
      await api.put(
        `/customer/move-profile/${moveId}`,
        payload,
      );

    return unwrap(response);
  },

  uploadMedia: async (
    moveRequestId,
    formData,
  ) => {
    const moveId = requireId(
      moveRequestId,
      "Move request ID",
    );

    const response =
      await api.post(
        `/customer/move-profile/${moveId}/media`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        },
      );

    return unwrap(response);
  },

  quotes: async (
    moveRequestId,
  ) => {
    const moveId = requireId(
      moveRequestId,
      "Move request ID",
    );

    const response =
      await api.get(
        `/customer/quotes/${moveId}`,
      );

    return unwrap(response);
  },

  selectQuote: async (
    quoteId,
  ) => {
    const id = requireId(
      quoteId,
      "Quote ID",
    );

    const response =
      await api.post(
        `/customer/quotes/${id}/select`,
      );

    return unwrap(response);
  },

  createDepositSession:
    async (payload) => {
      const response =
        await api.post(
          "/customer/payments/create-deposit-session",
          payload,
        );

      return unwrap(response);
    },

  payments: async () => {
    const response =
      await api.get(
        "/customer/payments",
      );

    return unwrap(response);
  },

  conversations: async () => {
    const response =
      await api.get(
        "/customer/messages",
      );

    return unwrap(response);
  },

  sendMessage: async (
    conversationId,
    payload,
  ) => {
    const id = requireId(
      conversationId,
      "Conversation ID",
    );

    const response =
      await api.post(
        `/customer/messages/${id}`,
        payload,
      );

    return unwrap(response);
  },

  notifications: async () => {
    const response =
      await api.get(
        "/customer/notifications",
      );

    return unwrap(response);
  },
};

/* ======================================================
   VENDOR APIs

   These routes are for a vendor's own dashboard.
   Admin vendor management methods must remain in adminAPI.
====================================================== */

export const vendorAPI = {
  dashboard: async () => {
    const response =
      await api.get(
        "/vendor/dashboard",
      );

    return unwrap(response);
  },

  leads: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/vendor/leads",
        {
          params,
        },
      );

    return unwrap(response);
  },

  quotes: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/vendor/quotes",
        {
          params,
        },
      );

    return unwrap(response);
  },

  conversations: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/vendor/messages",
        {
          params,
        },
      );

    return unwrap(response);
  },

  notifications: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/vendor/notifications",
        {
          params,
        },
      );

    return unwrap(response);
  },
};

/* ======================================================
   ADMIN APIs
====================================================== */

export const adminAPI = {
  /* ==================== DASHBOARD ==================== */

  dashboard: async () => {
    const response =
      await api.get(
        "/admin/dashboard",
      );

    return unwrap(response);
  },

  /* ==================== JOBS ==================== */

  jobs: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/admin/jobs",
        {
          params,
        },
      );

    return unwrap(response);
  },

  /* ==================== CUSTOMERS ==================== */

  customers: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/admin/customers",
        {
          params,
        },
      );

    return unwrap(response);
  },

  updateCustomerStatus:
    async (id, status) => {
      const customerId =
        requireId(
          id,
          "Customer ID",
        );

      const response =
        await api.put(
          `/admin/customers/${customerId}/status`,
          {
            status,
          },
        );

      return unwrap(response);
    },

  /* ==================== VENDORS ==================== */

  /*
   * GET /api/admin/vendors
   */
  vendors: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/admin/vendors",
        {
          params,
        },
      );

    return unwrap(response);
  },

  /*
   * GET /api/admin/vendors/:id
   *
   * Used by AdminVendorDetailsPage.
   */
  vendorById: async (id) => {
    const vendorId = requireId(
      id,
      "Vendor ID",
    );

    const response =
      await api.get(
        `/admin/vendors/${vendorId}`,
      );

    return unwrap(response);
  },

  /*
   * POST /api/admin/vendors
   */
  createVendor: async (
    payload,
  ) => {
    const response =
      await api.post(
        "/admin/vendors",
        payload,
      );

    return unwrap(response);
  },

  /*
   * PUT /api/admin/vendors/:id
   *
   * Updates all vendor fields, pin and boundary.
   */
  updateVendor: async (
    id,
    payload,
  ) => {
    const vendorId = requireId(
      id,
      "Vendor ID",
    );

    const response =
      await api.put(
        `/admin/vendors/${vendorId}`,
        payload,
      );

    return unwrap(response);
  },

  /*
   * PUT /api/admin/vendors/:id/boundary
   */
  updateVendorBoundary:
    async (
      id,
      serviceBoundary,
    ) => {
      const vendorId =
        requireId(
          id,
          "Vendor ID",
        );

      const normalizedBoundary =
        Array.isArray(
          serviceBoundary,
        )
          ? serviceBoundary
          : [];

      const response =
        await api.put(
          `/admin/vendors/${vendorId}/boundary`,
          {
            service_boundary:
              normalizedBoundary,
          },
        );

      return unwrap(response);
    },

  /*
   * PUT /api/admin/vendors/:id/status
   */
  updateVendorStatus: async (
    id,
    status,
  ) => {
    const vendorId = requireId(
      id,
      "Vendor ID",
    );

    const response =
      await api.put(
        `/admin/vendors/${vendorId}/status`,
        {
          status,
        },
      );

    return unwrap(response);
  },

  /*
   * PUT /api/admin/vendors/:id/suspend
   */
  suspendVendor: async (id) => {
    const vendorId = requireId(
      id,
      "Vendor ID",
    );

    const response =
      await api.put(
        `/admin/vendors/${vendorId}/suspend`,
        {},
      );

    return unwrap(response);
  },

  /*
   * PUT /api/admin/vendors/:id/verify
   */
  verifyVendor: async (
    id,
    verificationStatus =
      "verified",
  ) => {
    const vendorId = requireId(
      id,
      "Vendor ID",
    );

    const response =
      await api.put(
        `/admin/vendors/${vendorId}/verify`,
        {
          verification_status:
            verificationStatus,
        },
      );

    return unwrap(response);
  },

  /*
   * PUT /api/admin/vendors/documents/:documentId/review
   */
  reviewVendorDocument:
    async (
      documentId,
      payload,
    ) => {
      const id = requireId(
        documentId,
        "Document ID",
      );

      const response =
        await api.put(
          `/admin/vendors/documents/${id}/review`,
          payload,
        );

      return unwrap(response);
    },

  /* ==================== ASSIGNMENTS ==================== */

  createAssignment: async (
    payload,
  ) => {
    const response =
      await api.post(
        "/admin/assignments",
        payload,
      );

    return unwrap(response);
  },

  /* ==================== QUOTES ==================== */

  quotes: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/admin/quotes",
        {
          params,
        },
      );

    return unwrap(response);
  },

  /* ==================== MESSAGES ==================== */

  conversations: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/admin/messages",
        {
          params,
        },
      );

    return unwrap(response);
  },

  /* ==================== PAYMENTS ==================== */

  payments: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/admin/payments",
        {
          params,
        },
      );

    return unwrap(response);
  },

  /* ==================== ANALYTICS ==================== */

  analytics: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/admin/analytics",
        {
          params,
        },
      );

    return unwrap(response);
  },

  /* ==================== AUDIT LOGS ==================== */

  auditLogs: async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/admin/audit-logs",
        {
          params,
        },
      );

    return unwrap(response);
  },

  /* ==================== HOME CONTENT ==================== */

  homeContent: async () => {
    const response =
      await api.get(
        "/admin/home-content",
      );

    return unwrap(response);
  },

  updateHomeContent: async (
    payload,
  ) => {
    const response =
      await api.put(
        "/admin/home-content",
        payload,
      );

    return unwrap(response);
  },
};

/* ======================================================
   DASHBOARD API
====================================================== */

export const dashboardAPI = {
  get: async (role) => {
    const response =
      await api.get(
        `/${role}/dashboard`,
      );

    return unwrap(response);
  },
};

/* ======================================================
   PUBLIC APIs
====================================================== */

export const publicAPI = {
  home: async () => {
    const response =
      await api.get(
        "/public/home",
      );

    return unwrap(response);
  },

  contact: async (
    payload,
  ) => {
    const response =
      await api.post(
        "/public/home/contact",
        payload,
      );

    return unwrap(response);
  },
};

export default api;