import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";

import api from "../services/api.js";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  token: "anq_token",
  user: "anq_user",
  role: "anq_role",
  selectedRole: "anq_selected_role"
};

const roleEndpoints = {
  customer: "/customer/auth/login",
  vendor: "/vendor/auth/login",
  admin: "/admin/auth/login"
};

export const normalizeRole = (value) => {
  const role = String(value || "").toLowerCase().trim();

  if (role === "super_admin") return "admin";
  if (role === "admin") return "admin";
  if (role === "vendor") return "vendor";
  if (role === "customer") return "customer";

  if (role.includes("super_admin")) return "admin";
  if (role.includes("admin")) return "admin";
  if (role.includes("vendor")) return "vendor";
  if (role.includes("customer")) return "customer";

  return "";
};

export const getRedirectPathByRole = (value) => {
  const role = normalizeRole(value);

  if (role === "admin") return "/admin/dashboard";
  if (role === "vendor") return "/vendor/dashboard";
  if (role === "customer") return "/customer/dashboard";

  return "/login";
};

const safeJsonParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getStoredToken = () => {
  return (
    localStorage.getItem(STORAGE_KEYS.token) ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("access_token") ||
    ""
  );
};

const getStoredUser = () => {
  return (
    safeJsonParse(localStorage.getItem(STORAGE_KEYS.user)) ||
    safeJsonParse(localStorage.getItem("user")) ||
    null
  );
};

const getStoredRole = () => {
  return normalizeRole(
    localStorage.getItem(STORAGE_KEYS.selectedRole) ||
      localStorage.getItem(STORAGE_KEYS.role) ||
      localStorage.getItem("role") ||
      getStoredUser()?.role
  );
};

const clearOldAuthStorage = () => {
  [
    "token",
    "auth_token",
    "access_token",
    "user",
    "role",
    "customer",
    "vendor",
    "admin",
    "customer_token",
    "vendor_token",
    "admin_token",
    "anq_customer_token",
    "anq_vendor_token",
    "anq_admin_token",
    "anq_customer",
    "anq_vendor",
    "anq_admin"
  ].forEach((key) => localStorage.removeItem(key));
};

const extractResponseData = (response) => {
  const root = response?.data || response || {};
  return root?.data || root;
};

const extractToken = (response) => {
  const root = response?.data || response || {};
  const data = extractResponseData(response);

  return (
    data?.token ||
    data?.access_token ||
    data?.accessToken ||
    data?.auth_token ||
    root?.token ||
    root?.access_token ||
    root?.accessToken ||
    ""
  );
};

const extractUser = (response) => {
  const root = response?.data || response || {};
  const data = extractResponseData(response);

  return (
    data?.user ||
    data?.customer ||
    data?.vendor ||
    data?.admin ||
    root?.user ||
    root?.customer ||
    root?.vendor ||
    root?.admin ||
    {}
  );
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [role, setRole] = useState(() => getStoredRole());

  const saveSession = useCallback((response, forcedRole = "") => {
    const tokenValue = extractToken(response);
    const userValue = extractUser(response);

    const finalRole = normalizeRole(
      forcedRole ||
        userValue?.role ||
        userValue?.user_role ||
        userValue?.user_type ||
        userValue?.type
    );

    if (!tokenValue) {
      throw new Error("Login token missing from API response");
    }

    if (!finalRole) {
      throw new Error("User role missing from API response");
    }

    const finalUser = {
      ...userValue,
      role: finalRole
    };

    clearOldAuthStorage();

    localStorage.setItem(STORAGE_KEYS.token, tokenValue);
    localStorage.setItem(STORAGE_KEYS.role, finalRole);
    localStorage.setItem(STORAGE_KEYS.selectedRole, finalRole);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(finalUser));

    /*
      Keep these old/simple keys also because your existing api.js or layout
      may already read "token", "user", or "role".
    */
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("role", finalRole);
    localStorage.setItem("user", JSON.stringify(finalUser));

    setToken(tokenValue);
    setUser(finalUser);
    setRole(finalRole);

    return finalUser;
  }, []);

  const login = useCallback(
    async (selectedRole, form) => {
      const finalRole = normalizeRole(selectedRole);
      const endpoint = roleEndpoints[finalRole];

      if (!endpoint) {
        throw new Error("Invalid login role");
      }

      const emailOrMobile = String(form?.emailOrMobile || "").trim();

      const payload = {
        email: emailOrMobile,
        mobile: emailOrMobile,
        emailOrMobile,
        email_or_mobile: emailOrMobile,
        password: form?.password || ""
      };

      const response = await api.post(endpoint, payload);

      return saveSession(response, finalRole);
    },
    [saveSession]
  );

  const registerCustomer = useCallback(
    async (form) => {
      const payload = {
        full_name: String(form?.full_name || "").trim(),
        email: String(form?.email || "").trim(),
        mobile: String(form?.mobile || "").trim(),
        password: form?.password || ""
      };

      const response = await api.post("/customer/auth/register", payload);

      return saveSession(response, "customer");
    },
    [saveSession]
  );

  const googleCustomerLogin = useCallback(
    async (credential) => {
      const response = await api.post("/customer/auth/google", {
        credential
      });

      return saveSession(response, "customer");
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    clearOldAuthStorage();

    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.role);
    localStorage.removeItem(STORAGE_KEYS.selectedRole);

    setToken("");
    setUser(null);
    setRole("");
  }, []);

  const isAuthenticated = Boolean(token && user && role);

  const value = useMemo(
    () => ({
      token,
      user,
      role,
      isAuthenticated,
      login,
      registerCustomer,
      googleCustomerLogin,
      saveSession,
      logout,
      getRedirectPathByRole
    }),
    [
      token,
      user,
      role,
      isAuthenticated,
      login,
      registerCustomer,
      googleCustomerLogin,
      saveSession,
      logout
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export default AuthContext;