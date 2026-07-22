import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Truck,
  UserRound,
  WalletCards
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Logo from "../../components/common/Logo.jsx";
import { useAuth, getRedirectPathByRole } from "../../context/AuthContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";

const roleTabs = [
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "admin", label: "Admin" }
];

const initialLoginForm = {
  emailOrMobile: "",
  password: ""
};

const initialCustomerForm = {
  full_name: "",
  email: "",
  mobile: "",
  password: ""
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login, registerCustomer, googleCustomerLogin } = useAuth();

  const [role, setRole] = useState("customer");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [customerForm, setCustomerForm] = useState(initialCustomerForm);

  const afterLogin = (nextUser) => {
    const redirectPath = getRedirectPathByRole(nextUser?.role);

    navigate(redirectPath, {
      replace: true
    });
  };

  const selectRole = (nextRole) => {
    setRole(nextRole);
    setMode("login");
    setLoginForm(initialLoginForm);
  };

  const submitLogin = async (event) => {
    event.preventDefault();

    if (!loginForm.emailOrMobile.trim()) {
      showToast("Email address is required", "error");
      return;
    }

    if (!loginForm.password.trim()) {
      showToast("Password is required", "error");
      return;
    }

    setLoading(true);

    try {
      const nextUser = await login(role, loginForm);

      showToast("Login successful");

      afterLogin(nextUser);
    } catch (error) {
      showToast(error.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const submitCustomerRegister = async (event) => {
    event.preventDefault();

    if (!customerForm.full_name.trim()) {
      showToast("Full name is required", "error");
      return;
    }

    if (!customerForm.email.trim()) {
      showToast("Email is required", "error");
      return;
    }

    if (!customerForm.password.trim()) {
      showToast("Password is required", "error");
      return;
    }

    setLoading(true);

    try {
      const nextUser = await registerCustomer(customerForm);

      showToast("Customer account created");

      afterLogin(nextUser);
    } catch (error) {
      showToast(error.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      showToast("Google sign-in failed", "error");
      return;
    }

    setLoading(true);

    try {
      const nextUser = await googleCustomerLogin(credentialResponse.credential);

      showToast("Google sign-in successful");

      afterLogin(nextUser);
    } catch (error) {
      showToast(error.message || "Google sign-in failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const title =
    role === "customer"
      ? "Welcome to AnQ Movers"
      : role === "vendor"
        ? "Vendor Login"
        : "Admin Portal";

  const sub =
    role === "customer"
      ? "Smarter moves. Better experiences."
      : role === "vendor"
        ? "Welcome back. Please sign in to access your account."
        : "Sign in to your admin account.";

  const activeRoleLabel =
    roleTabs.find((item) => item.value === role)?.label || "User";

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-art">
          <div>
            <Logo />

            <h1>Move smarter with trusted UK movers.</h1>

            <p>
              Complete customer, vendor and admin workflows from move request to
              confirmed booking.
            </p>
          </div>

          <div className="login-proof">
            <span>
              <ShieldCheck size={22} />
              Secure & verified movers
            </span>

            <span>
              <WalletCards size={22} />
              £50 lock-in deposit
            </span>

            <span>
              <CheckCircle2 size={22} />
              Real backend workflow
            </span>
          </div>
        </section>

        <section className="login-card">
          <Logo />

          <h2>{title}</h2>

          <p>{sub}</p>

          <div className="role-tabs">
            {roleTabs.map((tab) => (
              <button
                key={tab.value}
                className={role === tab.value ? "active" : ""}
                type="button"
                onClick={() => selectRole(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {role === "customer" ? (
            <div className="google-login-box">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => showToast("Google sign-in failed", "error")}
                width="100%"
                text="continue_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />

              <div className="or-line">
                <span>or</span>
              </div>
            </div>
          ) : null}

          {mode === "login" ? (
            <form onSubmit={submitLogin}>
              <label className="login-field">
                <span>Email Address</span>

                <div>
                  <Mail size={17} />

                  <input
                    value={loginForm.emailOrMobile}
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        emailOrMobile: event.target.value
                      })
                    }
                    placeholder={
                      role === "admin"
                        ? "admin@anqmovers.com"
                        : role === "vendor"
                          ? "vendor@anqmovers.com"
                          : "your@email.com"
                    }
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Password</span>

                <div>
                  <Lock size={17} />

                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        password: event.target.value
                      })
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              <button className="red-btn login-submit" disabled={loading}>
                {loading ? "Please wait..." : `Sign In as ${activeRoleLabel}`}
              </button>
            </form>
          ) : (
            <form onSubmit={submitCustomerRegister}>
              <label className="login-field">
                <span>Full Name</span>

                <div>
                  <UserRound size={17} />

                  <input
                    value={customerForm.full_name}
                    onChange={(event) =>
                      setCustomerForm({
                        ...customerForm,
                        full_name: event.target.value
                      })
                    }
                    placeholder="John Carter"
                    autoComplete="name"
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Email</span>

                <div>
                  <Mail size={17} />

                  <input
                    value={customerForm.email}
                    onChange={(event) =>
                      setCustomerForm({
                        ...customerForm,
                        email: event.target.value
                      })
                    }
                    placeholder="john@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Mobile</span>

                <div>
                  <Phone size={17} />

                  <input
                    value={customerForm.mobile}
                    onChange={(event) =>
                      setCustomerForm({
                        ...customerForm,
                        mobile: event.target.value
                      })
                    }
                    placeholder="020 8064 1234"
                    autoComplete="tel"
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Password</span>

                <div>
                  <Lock size={17} />

                  <input
                    type="password"
                    value={customerForm.password}
                    onChange={(event) =>
                      setCustomerForm({
                        ...customerForm,
                        password: event.target.value
                      })
                    }
                    placeholder="Create password"
                    autoComplete="new-password"
                  />
                </div>
              </label>

              <button className="red-btn login-submit" disabled={loading}>
                {loading ? "Please wait..." : "Create Account"}
              </button>
            </form>
          )}

          {role === "customer" ? (
            <button
              className="switch-auth"
              type="button"
              onClick={() =>
                setMode((current) =>
                  current === "login" ? "register" : "login"
                )
              }
            >
              {mode === "login"
                ? "Don't have an account? Continue with email"
                : "Already have an account? Login"}
            </button>
          ) : (
            <div className="admin-vendor-note">
              <Truck size={15} />
              Vendor accounts are created by admin. Admin accounts are created
              from backend seed.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}