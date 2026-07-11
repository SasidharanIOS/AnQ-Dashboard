import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { CheckCircle2, Lock, Mail, Phone, ShieldCheck, Truck, UserRound, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/common/Logo.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";

const roleTabs = [
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "admin", label: "Admin" }
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login, registerCustomer, googleCustomerLogin } = useAuth();

  const [role, setRole] = useState("customer");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ emailOrMobile: "", password: "" });
  const [customerForm, setCustomerForm] = useState({ full_name: "", email: "", mobile: "", password: "" });

  const afterLogin = (nextUser) => {
    const rolePath = nextUser.role === "admin" || nextUser.role === "super_admin" ? "admin" : nextUser.role === "vendor" ? "vendor" : "customer";
    navigate(`/${rolePath}/dashboard`, { replace: true });
  };

  const submitLogin = async (event) => {
    event.preventDefault();
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

  const title = role === "customer" ? "Welcome to AnQ Movers" : role === "vendor" ? "Vendor Login" : "Admin Portal";
  const sub = role === "customer" ? "Smarter moves. Better experiences." : role === "vendor" ? "Welcome back. Please sign in to access your account." : "Sign in to your admin account.";

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-art">
          <div><Logo /><h1>Move smarter with trusted UK movers.</h1><p>Complete customer, vendor and admin workflows from move request to confirmed booking.</p></div>
          <div className="login-proof">
            <span><ShieldCheck size={22} /> Secure & verified movers</span>
            <span><WalletCards size={22} /> £50 lock-in deposit</span>
            <span><CheckCircle2 size={22} /> Real backend workflow</span>
          </div>
        </section>

        <section className="login-card">
          <Logo />
          <h2>{title}</h2>
          <p>{sub}</p>
          <div className="role-tabs">
            {roleTabs.map((tab) => (
              <button key={tab.value} className={role === tab.value ? "active" : ""} type="button" onClick={() => { setRole(tab.value); setMode("login"); }}>{tab.label}</button>
            ))}
          </div>

          {role === "customer" ? (
            <div className="google-login-box">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => showToast("Google sign-in failed", "error")} width="100%" text="continue_with" shape="rectangular" theme="outline" size="large" />
              <div className="or-line"><span>or</span></div>
            </div>
          ) : null}

          {mode === "login" ? (
            <form onSubmit={submitLogin}>
              <label className="login-field"><span>Email Address</span><div><Mail size={17} /><input value={loginForm.emailOrMobile} onChange={(e) => setLoginForm({ ...loginForm, emailOrMobile: e.target.value })} placeholder={role === "admin" ? "admin@anqmovers.com" : "your@email.com"} /></div></label>
              <label className="login-field"><span>Password</span><div><Lock size={17} /><input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Enter your password" /></div></label>
              <button className="red-btn login-submit" disabled={loading}>{loading ? "Please wait..." : "Sign In"}</button>
            </form>
          ) : (
            <form onSubmit={submitCustomerRegister}>
              <label className="login-field"><span>Full Name</span><div><UserRound size={17} /><input value={customerForm.full_name} onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })} placeholder="John Carter" /></div></label>
              <label className="login-field"><span>Email</span><div><Mail size={17} /><input value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} placeholder="john@example.com" /></div></label>
              <label className="login-field"><span>Mobile</span><div><Phone size={17} /><input value={customerForm.mobile} onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })} placeholder="020 8064 1234" /></div></label>
              <label className="login-field"><span>Password</span><div><Lock size={17} /><input type="password" value={customerForm.password} onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })} placeholder="Create password" /></div></label>
              <button className="red-btn login-submit" disabled={loading}>{loading ? "Please wait..." : "Create Account"}</button>
            </form>
          )}

          {role === "customer" ? (
            <button className="switch-auth" type="button" onClick={() => setMode((current) => current === "login" ? "register" : "login")}>{mode === "login" ? "Don't have an account? Continue with email" : "Already have an account? Login"}</button>
          ) : (
            <div className="admin-vendor-note"><Truck size={15} /> Vendor accounts are created by admin. Admin accounts are created from backend seed.</div>
          )}
        </section>
      </div>
    </div>
  );
}
