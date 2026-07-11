import React from "react";

export default function StatusBadge({ children, status }) {
  const text = String(children || status || "pending");
  return <em className={`status-chip ${text.toLowerCase().replaceAll("_", "-").replaceAll(" ", "-")}`}>{text.replaceAll("_", " ")}</em>;
}
