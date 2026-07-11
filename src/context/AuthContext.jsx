import React, { createContext, useContext, useMemo, useState } from "react";
import { authAPI } from "../services/api.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "anq_token";
const USER_KEY = "anq_user";

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => readStoredUser());

  const saveSession = (response) => {
    const nextToken = response?.token;
    const nextUser = response?.data;

    if (!nextToken || !nextUser) {
      throw new Error("Invalid login response");
    }

    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));

    setToken(nextToken);
    setUser(nextUser);

    return nextUser;
  };

  const login = async (role, payload) => {
    const response = await authAPI.login(role, payload);
    return saveSession(response);
  };

  const registerCustomer = async (payload) => {
    const response = await authAPI.registerCustomer(payload);
    return saveSession(response);
  };

  const googleCustomerLogin = async (credential) => {
    const response = await authAPI.googleCustomerLogin(credential);
    return saveSession(response);
  };

  const refreshCustomerProfile = async () => {
    const profile = await authAPI.profile("customer");
    const nextUser = {
      ...profile,
      role: "customer"
    };

    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);

    return nextUser;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      registerCustomer,
      googleCustomerLogin,
      refreshCustomerProfile,
      logout
    }),
    [token, user]
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