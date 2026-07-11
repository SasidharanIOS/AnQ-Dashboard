import React, { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(window.__anqToastTimer);
    window.__anqToastTimer = window.setTimeout(() => setToast(null), 3200);
  };
  const value = useMemo(() => ({ showToast }), []);
  return <ToastContext.Provider value={value}>{children}{toast ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}</ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);
