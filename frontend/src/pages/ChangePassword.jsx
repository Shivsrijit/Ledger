import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/client.js";
import { formatApiError } from "../lib/errors.js";
import PasswordField from "../components/PasswordField.jsx";

const HINT = "At least 10 characters with uppercase, lowercase, a number, and a special character.";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (newPassword !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setOk("Password updated. You can keep working.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Change password</h1>
      <p className="page-sub">Use a strong password. {HINT}</p>

      <div className="card" style={{ maxWidth: 480 }}>
        {ok ? (
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
            {ok}
          </div>
        ) : null}
        {error ? <div className="alert-error">{error}</div> : null}
        <form onSubmit={submit}>
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
