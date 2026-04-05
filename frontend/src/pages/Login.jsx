import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { formatApiError } from "../lib/errors.js";
import PasswordField from "../components/PasswordField.jsx";

export default function Login() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    if (location.state?.registered) {
      setFlash("Account created. Sign in with your email and password.");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  if (ready && user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
      navigate("/", { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ justifyContent: "center", padding: "2rem 1.25rem" }}>
      <div style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
        <p style={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.02em", margin: "0 0 0.25rem" }}>Ledger</p>
        <p className="page-sub" style={{ marginBottom: "1.5rem" }}>
          Sign in to your workspace.
        </p>
        <div className="card">
          <form onSubmit={onSubmit}>
            {flash ? (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(29, 122, 76, 0.1)",
                  color: "var(--income)",
                  fontSize: "0.875rem",
                  marginBottom: "1rem"
                }}
              >
                {flash}
              </div>
            ) : null}
            {error ? <div className="alert-error">{error}</div> : null}
            <div className="form-group">
              <label htmlFor="em">Email</label>
              <input id="em" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <PasswordField
              id="pw"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.9375rem", color: "var(--text-muted)" }}>
          First time? <Link to="/register">Create the admin account</Link>
        </p>
      </div>
    </div>
  );
}
