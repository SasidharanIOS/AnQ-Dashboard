import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:7070/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("anq_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export const unwrap = (response) => {
  return response?.data?.data ?? response?.data ?? response;
};

export const safeArray = (value) => {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(value)) return value;
  return [];
};

export const money = (value, currency = "GBP") => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency
  }).format(amount);
};

export const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

export const authAPI = {
  login: async (role, payload) => {
    const response = await api.post(`/${role}/auth/login`, payload);
    return response.data;
  },

  registerCustomer: async (payload) => {
    const response = await api.post("/customer/auth/register", payload);
    return response.data;
  },

  registerVendor: async (payload) => {
    const response = await api.post("/vendor/auth/register", payload);
    return response.data;
  },

  googleCustomerLogin: async (credential) => {
    const response = await api.post("/customer/auth/google", { credential });
    return response.data;
  },

  profile: async (role) => {
    const response = await api.get(`/${role}/auth/profile`);
    return unwrap(response);
  },

  updateProfile: async (role, payload) => {
    const response = await api.put(`/${role}/auth/profile`, payload);
    return unwrap(response);
  },

  createCustomerPassword: async (payload) => {
    const response = await api.put("/customer/auth/create-password", payload);
    return unwrap(response);
  }
};

export const customerAPI = {
  moves: async (params = {}) => unwrap(await api.get("/customer/moves", { params })),

  createMove: async (payload) => unwrap(await api.post("/customer/moves", payload)),

  cancelMove: async (id) => unwrap(await api.put(`/customer/moves/${id}/cancel`)),

  updateMoveProfile: async (moveRequestId, payload) =>
    unwrap(await api.put(`/customer/move-profile/${moveRequestId}`, payload)),

  uploadMedia: async (moveRequestId, formData) => {
    const response = await api.post(
      `/customer/move-profile/${moveRequestId}/media`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );
    return unwrap(response);
  },

  quotes: async (moveRequestId) =>
    unwrap(await api.get(`/customer/quotes/${moveRequestId}`)),

  selectQuote: async (quoteId) =>
    unwrap(await api.post(`/customer/quotes/${quoteId}/select`)),

  createDepositSession: async (payload) =>
    unwrap(await api.post("/customer/payments/create-deposit-session", payload)),

  payments: async () => unwrap(await api.get("/customer/payments")),

  conversations: async () => unwrap(await api.get("/customer/messages")),

  sendMessage: async (conversationId, payload) =>
    unwrap(await api.post(`/customer/messages/${conversationId}`, payload)),

  notifications: async () => unwrap(await api.get("/customer/notifications"))
};

export const vendorAPI = {
  leads: async (params = {}) =>
    unwrap(await api.get("/vendor/leads", { params })),

  leadById: async (id) => unwrap(await api.get(`/vendor/leads/${id}`)),

  submitQuote: async (payload) =>
    unwrap(await api.post("/vendor/quotes", payload)),

  quotes: async () => unwrap(await api.get("/vendor/quotes")),

  withdrawQuote: async (id) =>
    unwrap(await api.put(`/vendor/quotes/${id}/withdraw`)),

  conversations: async () => unwrap(await api.get("/vendor/messages")),

  sendMessage: async (conversationId, payload) =>
    unwrap(await api.post(`/vendor/messages/${conversationId}`, payload)),

  payments: async () => unwrap(await api.get("/vendor/payments")),

  notifications: async () => unwrap(await api.get("/vendor/notifications"))
};

export const adminAPI = {
  jobs: async (params = {}) => unwrap(await api.get("/admin/jobs", { params })),

  customers: async (params = {}) =>
    unwrap(await api.get("/admin/customers", { params })),

  vendors: async (params = {}) =>
    unwrap(await api.get("/admin/vendors", { params })),

  createVendor: async (payload) =>
    unwrap(await api.post("/admin/vendors", payload)),

  updateVendorStatus: async (id, status) =>
    unwrap(await api.put(`/admin/vendors/${id}/status`, { status })),

  verifyVendor: async (id, verification_status = "verified") =>
    unwrap(
      await api.put(`/admin/vendors/${id}/verify`, { verification_status })
    ),

  updateCustomerStatus: async (id, status) =>
    unwrap(await api.put(`/admin/customers/${id}/status`, { status })),

  createAssignment: async (payload) =>
    unwrap(await api.post("/admin/assignments", payload)),

  quotes: async () => unwrap(await api.get("/admin/quotes")),

  conversations: async () => unwrap(await api.get("/admin/messages")),

  payments: async () => unwrap(await api.get("/admin/payments")),

  analytics: async () => unwrap(await api.get("/admin/analytics")),

  auditLogs: async () => unwrap(await api.get("/admin/audit-logs")),

  homeContent: async () => unwrap(await api.get("/admin/home-content"))
};

export const dashboardAPI = {
  get: async (role) => unwrap(await api.get(`/${role}/dashboard`))
};

export const publicAPI = {
  home: async () => unwrap(await api.get("/public/home")),

  contact: async (payload) =>
    unwrap(await api.post("/public/home/contact", payload))
};

export default api;