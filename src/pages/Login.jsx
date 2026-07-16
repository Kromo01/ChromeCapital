import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Lock, LogIn, Mail, ShieldAlert, User } from "lucide-react";
import PageLayout from "../components/PageLayout.jsx";
import { COLORS } from "../styles/tokens.js";
import { FieldLabel } from "../components/FormControls.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function TextField({ label, type = "text", value, onChange, autoComplete, icon: Icon, placeholder }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div
        className="flex items-center gap-2 rounded-lg px-3"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
      >
        {Icon && <Icon size={14} style={{ color: COLORS.textFaint }} className="flex-shrink-0" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="w-full bg-transparent py-2.5 outline-none text-sm"
          style={{ color: COLORS.text }}
        />
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

export default function Login() {
  const { user, firebaseReady, signUp, logIn, logInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, redirectTo, navigate]);

  if (user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResetSent(false);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password, name.trim());
      } else {
        await logIn(email.trim(), password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await logInWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setResetSent(false);
    if (!email.trim()) {
      setError("Enter your email above first, then click 'Forgot password?'.");
      return;
    }
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PageLayout>
      <section className="max-w-md mx-auto px-5 py-16 md:py-24">
        <div className="flex items-center gap-2 mb-4 justify-center">
          <Lock size={14} style={{ color: COLORS.gold }} />
          <span className="text-xs uppercase tracking-[0.25em] font-medium" style={{ color: COLORS.textFaint }}>
            Your account
          </span>
        </div>
        <h1 className="font-display text-3xl text-center mb-2" style={{ color: COLORS.text }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: COLORS.textMuted }}>
          {mode === "login"
            ? "Log in to pick up your investments, budget and first-home planning where you left off."
            : "Save your investment scenarios, budget and first-home numbers to your account, synced across devices."}
        </p>

        {!firebaseReady && (
          <div
            className="rounded-xl p-4 mb-6 flex items-start gap-3 text-xs leading-relaxed"
            style={{ background: "rgba(194,86,46,0.10)", border: `1px solid ${COLORS.ember}66`, color: COLORS.textMuted }}
          >
            <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.ember }} />
            <span>
              Accounts aren't configured yet. Add your Firebase project keys to the site's <code>.env</code> file
              and restart the dev server to enable login.
            </span>
          </div>
        )}

        <div className="rounded-2xl p-6" style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy || !firebaseReady}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium mb-5 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: COLORS.text, color: "#161006" }}
          >
            <GoogleG /> Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1" style={{ background: COLORS.border }} />
            <span className="text-xs" style={{ color: COLORS.textFaint }}>
              or with email
            </span>
            <div className="h-px flex-1" style={{ background: COLORS.border }} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <TextField label="Name" value={name} onChange={setName} autoComplete="name" icon={User} placeholder="Jayden Krome" />
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              icon={Mail}
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              icon={Lock}
              placeholder="••••••••"
            />
            {mode === "signup" && (
              <TextField
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                icon={Lock}
                placeholder="••••••••"
              />
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs self-end -mt-2"
                style={{ color: COLORS.textFaint }}
              >
                Forgot password?
              </button>
            )}

            {error && (
              <div className="flex items-start gap-2 text-xs" style={{ color: COLORS.ember }}>
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {resetSent && (
              <div className="flex items-start gap-2 text-xs" style={{ color: COLORS.teal }}>
                <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
                <span>Password reset email sent — check your inbox.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !firebaseReady}
              className="inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold mt-1 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: COLORS.gold, color: "#161006" }}
            >
              <LogIn size={15} /> {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: COLORS.textMuted }}>
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setResetSent(false);
            }}
            className="font-medium"
            style={{ color: COLORS.gold }}
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </section>
    </PageLayout>
  );
}
