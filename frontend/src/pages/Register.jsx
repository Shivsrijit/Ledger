import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { formatApiError } from "../lib/errors.js";

export default function Register() {
  const { user, ready, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (ready && user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password.trim());
      navigate("/login", { replace: true, state: { registered: true } });
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
          Create the first admin user (only works on an empty database). Further users are created by an admin.
        </p>
        <div className="card">
          <form onSubmit={onSubmit}>
            {error ? <div className="alert-error">{error}</div> : null}
            <div className="form-group">
              <label htmlFor="nm">Name</label>
              <input id="nm" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="em">Email</label>
              <input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="pw">Password</label>
              <input id="pw" type="password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} />
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.35rem 0 0" }}>
                Use at least 10 characters with uppercase, lowercase, a number, and a special character (!@#$…).
              </p>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
        </div>
        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.9375rem", color: "var(--text-muted)" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
