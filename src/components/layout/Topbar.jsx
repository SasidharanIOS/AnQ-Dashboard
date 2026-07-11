import React from "react";
import { Bell, ChevronDown, Phone } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const displayNameFromUser = (user, role) => {
  if (!user) return role === "admin" ? "Admin User" : "John";
  return (
    user.full_name ||
    user.company_name ||
    user.contact_person ||
    user.name ||
    (role === "admin" ? "Admin User" : role === "vendor" ? "MoveMaster" : "John")
  );
};

export default function Topbar({ title, role }) {
  const { user } = useAuth();
  const notificationCount = role === "admin" ? 12 : role === "vendor" ? 5 : 3;
  const displayName = displayNameFromUser(user, role);
  const initials = displayName
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const subtitle =
    role === "vendor"
      ? user?.verification_status === "verified"
        ? "Verified Vendor"
        : "Vendor"
      : role === "admin"
        ? "Admin User"
        : "Customer";

  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="top-actions">
        <div className="phone-help">
          <Phone size={18} />
          <div>
            <span>Need help?</span>
            <b>020 8064 1234</b>
          </div>
        </div>
        <button className="notify-btn" type="button">
          <Bell size={18} />
          <small>{notificationCount}</small>
        </button>
        <div className="profile-chip">
          <div className={`avatar avatar-${role}`}>
            {user?.profile_picture ? <img src={user.profile_picture} alt={displayName} /> : initials}
          </div>
          <div>
            <b>{role === "customer" ? `Hello, ${displayName}` : displayName}</b>
            <span>{subtitle}</span>
          </div>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  );
}
