import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  XCircle
} from "lucide-react";

import { authAPI, formatDate } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { FormGrid, TextInput } from "../../components/ui/Form.jsx";
import { PageHeader } from "../../components/ui/PortalUI.jsx";

const getInitial = (name = "Customer") =>
  String(name || "Customer").trim().slice(0, 1).toUpperCase();

const authProviderLabel = (provider) => {
  if (provider === "google") return "Google Sign-In";
  if (provider === "both") return "Google + Password";
  return "Email Password";
};

const yesNo = (value) => (value ? "Yes" : "No");

function VerificationBadge({ active, children }) {
  return (
    <span className={`anq-profile-badge ${active ? "success" : "warning"}`}>
      {active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {children}
    </span>
  );
}

function StatusCard({ icon: Icon, label, value, note, tone = "blue" }) {
  return (
    <section className={`anq-clean-status-card ${tone}`}>
      <div className="anq-clean-status-icon">
        <Icon size={18} />
      </div>

      <div className="anq-clean-status-copy">
        <span>{label}</span>
        <b>{value || "—"}</b>
        <p>{note || "—"}</p>
      </div>
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="anq-clean-detail-row">
      <span>{label}</span>
      <b>{value || "—"}</b>
    </div>
  );
}

export default function CustomerProfilePage() {
  const { showToast } = useToast();
  const { refreshCustomerProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);

  const [form, setForm] = useState({
    password: "",
    confirm_password: ""
  });

  const loadProfile = async () => {
    setLoading(true);

    try {
      const data = await authAPI.profile("customer");
      setProfile(data);
    } catch (error) {
      showToast(error.message || "Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const passwordStrength = useMemo(() => {
    const password = form.password || "";

    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ];

    const score = checks.filter(Boolean).length;

    if (!password) return { label: "Not started", width: "0%" };
    if (score <= 2) return { label: "Weak", width: "35%" };
    if (score <= 4) return { label: "Good", width: "70%" };
    return { label: "Strong", width: "100%" };
  }, [form.password]);

  const savePassword = async (event) => {
    event.preventDefault();

    if (!form.password || !form.confirm_password) {
      showToast("Password and confirm password are required", "error");
      return;
    }

    if (form.password.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }

    if (form.password !== form.confirm_password) {
      showToast("Passwords do not match", "error");
      return;
    }

    setSavingPassword(true);

    try {
      const updatedProfile = await authAPI.createCustomerPassword(form);

      let refreshedProfile = updatedProfile;

      if (typeof refreshCustomerProfile === "function") {
        refreshedProfile = await refreshCustomerProfile();
      }

      setProfile(refreshedProfile || updatedProfile);

      showToast(
        profile?.has_password
          ? "Password updated successfully"
          : "Password created successfully"
      );

      setForm({
        password: "",
        confirm_password: ""
      });

      setPasswordModalOpen(false);
    } catch (error) {
      showToast(error.message || "Failed to save password", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page-wrap anq-customer-profile-page-scroll">
      <style>
        {`
          .anq-customer-profile-page-scroll {
            width: 100%;
            height: calc(100vh - 92px);
            max-height: calc(100vh - 92px);
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0 8px 34px 0;
            scroll-behavior: smooth;
            overscroll-behavior: contain;
          }

          .anq-customer-profile-page-scroll::-webkit-scrollbar {
            width: 8px;
          }

          .anq-customer-profile-page-scroll::-webkit-scrollbar-track {
            background: #f2f6fc;
            border-radius: 999px;
          }

          .anq-customer-profile-page-scroll::-webkit-scrollbar-thumb {
            background: #c7d4e8;
            border-radius: 999px;
          }

          .anq-customer-profile-clean {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 18px;
            position: relative;
            isolation: isolate;
          }

          .anq-customer-profile-clean * {
            box-sizing: border-box;
          }

          .anq-customer-profile-clean > * {
            position: relative;
            z-index: auto;
            margin-top: 0;
            margin-bottom: 0;
            transform: none;
          }

          .anq-clean-status-grid {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(4, minmax(180px, 1fr));
            gap: 14px;
            position: relative;
            z-index: 1;
            clear: both;
          }

          .anq-clean-status-card {
            min-height: 126px;
            padding: 18px;
            border-radius: 18px;
            border: 1px solid #dbe5f4;
            background: #ffffff;
            box-shadow: 0 12px 30px rgba(7, 25, 79, 0.045);
            display: flex;
            align-items: flex-start;
            gap: 14px;
            overflow: hidden;
          }

          .anq-clean-status-icon {
            width: 46px;
            height: 46px;
            border-radius: 15px;
            display: grid;
            place-items: center;
            background: #eef5ff;
            color: #005eff;
            flex: 0 0 auto;
          }

          .anq-clean-status-card.green .anq-clean-status-icon {
            background: #e9fff4;
            color: #079b58;
          }

          .anq-clean-status-card.orange .anq-clean-status-icon {
            background: #fff7ed;
            color: #c2410c;
          }

          .anq-clean-status-card.red .anq-clean-status-icon {
            background: #fff1f2;
            color: #f20f18;
          }

          .anq-clean-status-copy {
            min-width: 0;
          }

          .anq-clean-status-copy span {
            display: block;
            color: #667297;
            font-size: 12px;
            font-weight: 850;
            margin-bottom: 8px;
          }

          .anq-clean-status-copy b {
            display: block;
            color: #07194f;
            font-size: 19px;
            font-weight: 950;
            line-height: 1.2;
            word-break: break-word;
          }

          .anq-clean-status-copy p {
            margin: 6px 0 0;
            color: #667297;
            font-size: 12px;
            font-weight: 750;
            line-height: 1.35;
            word-break: break-word;
          }

          .anq-clean-overview-grid {
            width: 100%;
            display: grid;
            grid-template-columns: minmax(420px, 1.15fr) minmax(360px, 0.85fr);
            gap: 18px;
            align-items: stretch;
            position: relative;
            z-index: 1;
            clear: both;
          }

          .anq-clean-profile-card,
          .anq-clean-security-card,
          .anq-clean-details-card {
            border: 1px solid #dbe5f4;
            border-radius: 20px;
            background: #ffffff;
            box-shadow: 0 14px 34px rgba(7, 25, 79, 0.045);
            overflow: hidden;
          }

          .anq-clean-profile-card {
            min-height: 220px;
            padding: 26px;
            display: flex;
            align-items: center;
            gap: 24px;
            background:
              radial-gradient(circle at top left, rgba(0, 94, 255, 0.09), transparent 35%),
              linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
          }

          .anq-clean-avatar {
            width: 94px;
            height: 94px;
            border-radius: 28px;
            display: grid;
            place-items: center;
            overflow: hidden;
            flex: 0 0 auto;
            background: #07194f;
            color: #ffffff;
            font-size: 34px;
            font-weight: 950;
            box-shadow: 0 18px 35px rgba(7, 25, 79, 0.16);
          }

          .anq-clean-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .anq-clean-profile-info {
            min-width: 0;
            flex: 1;
          }

          .anq-clean-profile-info h2 {
            margin: 0;
            color: #07194f;
            font-size: 30px;
            font-weight: 950;
            line-height: 1.1;
            letter-spacing: -0.035em;
            word-break: break-word;
          }

          .anq-clean-profile-info p {
            margin: 8px 0 0;
            color: #667297;
            font-size: 14px;
            font-weight: 750;
            line-height: 1.45;
            word-break: break-word;
          }

          .anq-profile-badge-row {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 16px;
          }

          .anq-profile-badge {
            min-height: 31px;
            padding: 0 12px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: #eef5ff;
            color: #0a3a8d;
            border: 1px solid #dbe5f4;
            font-size: 12px;
            font-weight: 900;
            white-space: nowrap;
          }

          .anq-profile-badge.success {
            background: #e9fff4;
            color: #079b58;
            border-color: #bff3d9;
          }

          .anq-profile-badge.warning {
            background: #fff7ed;
            color: #c2410c;
            border-color: #fed7aa;
          }

          .anq-clean-security-card {
            min-height: 220px;
            padding: 26px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 22px;
            background:
              radial-gradient(circle at top right, rgba(242, 15, 24, 0.08), transparent 34%),
              #ffffff;
          }

          .anq-clean-security-head {
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }

          .anq-clean-security-icon {
            width: 54px;
            height: 54px;
            border-radius: 17px;
            display: grid;
            place-items: center;
            background: #fff1f2;
            color: #f20f18;
            flex: 0 0 auto;
          }

          .anq-clean-security-card h3 {
            margin: 0;
            color: #07194f;
            font-size: 20px;
            font-weight: 950;
            letter-spacing: -0.02em;
          }

          .anq-clean-security-card p {
            margin: 8px 0 0;
            color: #667297;
            font-size: 13px;
            font-weight: 750;
            line-height: 1.45;
          }

          .anq-clean-security-card .red-btn {
            width: 100%;
            min-height: 46px;
            border-radius: 12px;
            justify-content: center;
            font-size: 14px;
            font-weight: 900;
          }

          .anq-clean-details-card {
            width: 100%;
            padding: 24px;
            position: relative;
            z-index: 1;
            clear: both;
          }

          .anq-clean-details-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            padding-bottom: 18px;
            margin-bottom: 20px;
            border-bottom: 1px solid #e6edf7;
          }

          .anq-clean-details-head h2 {
            margin: 0;
            color: #07194f;
            font-size: 22px;
            font-weight: 950;
            letter-spacing: -0.02em;
          }

          .anq-clean-details-head p {
            margin: 7px 0 0;
            color: #667297;
            font-size: 13px;
            font-weight: 750;
          }

          .anq-clean-details-layout {
            display: grid;
            grid-template-columns: repeat(2, minmax(280px, 1fr));
            gap: 18px;
          }

          .anq-clean-detail-group {
            padding: 20px;
            border-radius: 17px;
            background: #f8fbff;
            border: 1px solid #dbe5f4;
          }

          .anq-clean-detail-group h3 {
            margin: 0 0 15px;
            color: #07194f;
            font-size: 16px;
            font-weight: 950;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .anq-clean-detail-row {
            display: grid;
            grid-template-columns: 155px minmax(0, 1fr);
            gap: 18px;
            align-items: start;
            padding: 12px 0;
            border-top: 1px solid #e6edf7;
          }

          .anq-clean-detail-row:first-of-type {
            border-top: 0;
            padding-top: 0;
          }

          .anq-clean-detail-row:last-child {
            padding-bottom: 0;
          }

          .anq-clean-detail-row span {
            color: #667297;
            font-size: 13px;
            font-weight: 850;
            line-height: 1.4;
          }

          .anq-clean-detail-row b {
            color: #07194f;
            font-size: 13px;
            font-weight: 900;
            line-height: 1.45;
            word-break: break-word;
          }

          .anq-password-strength-box {
            margin-top: 14px;
            padding: 14px;
            border-radius: 14px;
            background: #f8fbff;
            border: 1px solid #dbe5f4;
          }

          .anq-password-strength-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 10px;
          }

          .anq-password-strength-head b {
            color: #07194f;
            font-size: 13px;
            font-weight: 900;
          }

          .anq-password-strength-head span {
            color: #667297;
            font-size: 12px;
            font-weight: 800;
          }

          .anq-strength-track {
            height: 8px;
            border-radius: 999px;
            background: #e6edf7;
            overflow: hidden;
          }

          .anq-strength-track i {
            display: block;
            height: 100%;
            border-radius: 999px;
            background: #f20f18;
            transition: width 0.2s ease;
          }

          .anq-password-tips {
            display: grid;
            gap: 7px;
            margin-top: 12px;
          }

          .anq-password-tips span {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #667297;
            font-size: 12px;
            font-weight: 750;
          }

          .anq-password-tips span.done {
            color: #079b58;
          }

          @media (max-width: 1180px) {
            .anq-customer-profile-page-scroll {
              height: calc(100vh - 76px);
              max-height: calc(100vh - 76px);
            }

            .anq-clean-status-grid {
              grid-template-columns: repeat(2, minmax(180px, 1fr));
            }

            .anq-clean-overview-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 720px) {
            .anq-customer-profile-page-scroll {
              height: calc(100vh - 68px);
              max-height: calc(100vh - 68px);
              padding-right: 4px;
            }

            .anq-clean-status-grid,
            .anq-clean-details-layout {
              grid-template-columns: 1fr;
            }

            .anq-clean-profile-card {
              flex-direction: column;
              align-items: flex-start;
            }

            .anq-clean-profile-info h2 {
              font-size: 25px;
            }

            .anq-clean-detail-row {
              grid-template-columns: 1fr;
              gap: 4px;
            }
          }
        `}
      </style>

      <div className="anq-customer-profile-clean">
        <PageHeader
          icon={UserRound}
          title="Profile"
          subtitle="Manage your customer profile, Google sign-in account and password access."
        />

        <div className="anq-clean-status-grid">
          <StatusCard
            icon={ShieldCheck}
            label="Account Status"
            value={profile?.status || "—"}
            note="Customer account access"
            tone={profile?.status === "active" ? "green" : "orange"}
          />

          <StatusCard
            icon={Mail}
            label="Email"
            value={profile?.email_verified ? "Verified" : "Pending"}
            note={profile?.email || "—"}
            tone={profile?.email_verified ? "green" : "orange"}
          />

          <StatusCard
            icon={Phone}
            label="Mobile"
            value={profile?.mobile_verified ? "Verified" : "Pending"}
            note={profile?.mobile || "Not added"}
            tone={profile?.mobile_verified ? "green" : "blue"}
          />

          <StatusCard
            icon={CalendarDays}
            label="Joined"
            value={formatDate(profile?.created_at)}
            note="AnQ Movers customer"
            tone="blue"
          />
        </div>

        <div className="anq-clean-overview-grid">
          <section className="anq-clean-profile-card">
            <div className="anq-clean-avatar">
              {profile?.profile_picture ? (
                <img src={profile.profile_picture} alt={profile.full_name} />
              ) : (
                getInitial(profile?.full_name)
              )}
            </div>

            <div className="anq-clean-profile-info">
              <h2>
                {loading
                  ? "Loading profile..."
                  : profile?.full_name || "Customer"}
              </h2>

              <p>{profile?.email || "Your customer account details"}</p>

              <div className="anq-profile-badge-row">
                <span className="anq-profile-badge">
                  <UserRound size={13} />
                  {authProviderLabel(profile?.auth_provider)}
                </span>

                <VerificationBadge active={profile?.email_verified}>
                  {profile?.email_verified ? "Email Verified" : "Email Pending"}
                </VerificationBadge>

                <VerificationBadge active={profile?.has_password}>
                  {profile?.has_password
                    ? "Password Created"
                    : "Password Not Set"}
                </VerificationBadge>
              </div>
            </div>
          </section>

          <section className="anq-clean-security-card">
            <div className="anq-clean-security-head">
              <div className="anq-clean-security-icon">
                <LockKeyhole size={22} />
              </div>

              <div>
                <h3>
                  {profile?.has_password
                    ? "Password Access Enabled"
                    : "Create Password Access"}
                </h3>

                <p>
                  {profile?.has_password
                    ? "You can login using Google or email and password."
                    : "You signed in with Google. Create a password to also login using email and password."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="red-btn"
              onClick={() => setPasswordModalOpen(true)}
            >
              <KeyRound size={15} />
              {profile?.has_password ? "Update Password" : "Create Password"}
            </button>
          </section>
        </div>

        <section className="anq-clean-details-card">
          <div className="anq-clean-details-head">
            <div>
              <h2>Customer Details</h2>
              <p>Your saved profile information from the backend.</p>
            </div>
          </div>

          <div className="anq-clean-details-layout">
            <div className="anq-clean-detail-group">
              <h3>
                <UserRound size={16} />
                Personal Information
              </h3>

              <DetailRow label="Full Name" value={profile?.full_name} />
              <DetailRow label="Email" value={profile?.email} />
              <DetailRow label="Mobile" value={profile?.mobile} />
              <DetailRow
                label="Joined On"
                value={formatDate(profile?.created_at)}
              />
            </div>

            <div className="anq-clean-detail-group">
              <h3>
                <ShieldCheck size={16} />
                Account Access
              </h3>

              <DetailRow
                label="Login Type"
                value={authProviderLabel(profile?.auth_provider)}
              />

              <DetailRow
                label="Email Verified"
                value={yesNo(profile?.email_verified)}
              />

              <DetailRow
                label="Mobile Verified"
                value={yesNo(profile?.mobile_verified)}
              />

              <DetailRow
                label="Password Status"
                value={profile?.has_password ? "Created" : "Not created yet"}
              />

              <DetailRow label="Account Status" value={profile?.status} />
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={passwordModalOpen}
        title={profile?.has_password ? "Update Password" : "Create Password"}
        onClose={() => setPasswordModalOpen(false)}
      >
        <form onSubmit={savePassword}>
          <FormGrid>
            <TextInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => setForm({ ...form, password: value })}
              placeholder="Enter password"
            />

            <TextInput
              label="Confirm Password"
              type="password"
              value={form.confirm_password}
              onChange={(value) =>
                setForm({ ...form, confirm_password: value })
              }
              placeholder="Confirm password"
            />
          </FormGrid>

          <div className="anq-password-strength-box">
            <div className="anq-password-strength-head">
              <b>Password Strength</b>
              <span>{passwordStrength.label}</span>
            </div>

            <div className="anq-strength-track">
              <i style={{ width: passwordStrength.width }} />
            </div>

            <div className="anq-password-tips">
              <span className={form.password.length >= 8 ? "done" : ""}>
                <ShieldCheck size={12} />
                Minimum 8 characters
              </span>

              <span className={/[A-Z]/.test(form.password) ? "done" : ""}>
                <ShieldCheck size={12} />
                At least one uppercase letter
              </span>

              <span className={/[0-9]/.test(form.password) ? "done" : ""}>
                <ShieldCheck size={12} />
                At least one number
              </span>

              <span
                className={
                  form.password && form.password === form.confirm_password
                    ? "done"
                    : ""
                }
              >
                <ShieldCheck size={12} />
                Passwords should match
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="outline-btn"
              onClick={() => setPasswordModalOpen(false)}
              disabled={savingPassword}
            >
              Cancel
            </button>

            <button className="red-btn" disabled={savingPassword}>
              {savingPassword
                ? "Saving..."
                : profile?.has_password
                  ? "Update Password"
                  : "Create Password"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}