import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatApiError } from "../lib/errors.js";
import PasswordField from "../components/PasswordField.jsx";

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(22,24,29,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  padding: "1rem"
};

const modal = {
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  maxWidth: 440,
  width: "100%",
  maxHeight: "90vh",
  overflow: "auto",
  padding: "1.5rem",
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)"
};

const PASSWORD_RULES =
  "At least 10 characters, with uppercase, lowercase, a number, and a special character (!@#$… etc.).";

export default function Team() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [statusUser, setStatusUser] = useState(null);
  const [statusMode, setStatusMode] = useState("deactivate");
  const [removeUser, setRemoveUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [formErr, setFormErr] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await usersApi.list({ page, limit: 10, search: appliedSearch || undefined });
      setData(res.data);
    } catch (e) {
      setError(formatApiError(e));
    }
  }, [page, appliedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  return (
    <>
      <h1 className="page-title">Team</h1>
      <p className="page-sub">Invite users, assign roles, and control access. Sensitive changes require your password.</p>

      {error ? <div className="alert-error">{error}</div> : null}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", justifyContent: "space-between" }}>
          <form onSubmit={onSearchSubmit} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 220 }}>
              <label htmlFor="q">Search name or email</label>
              <input id="q" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type and press Search" />
            </div>
            <button type="submit" className="btn btn-ghost">
              Search
            </button>
          </form>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setFormErr("");
              setCreateOpen(true);
            }}
          >
            Add user
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.name}
                    {u.is_primary_admin ? (
                      <span style={{ marginLeft: 6, fontSize: "0.7rem", color: "var(--text-muted)" }}>(primary)</span>
                    ) : null}
                  </td>
                  <td>{u.email}</td>
                  <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                  <td>{u.is_active ? "Active" : "Inactive"}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: "0.35rem 0.65rem" }}
                      onClick={() => {
                        setFormErr("");
                        setEditUser(u);
                      }}
                    >
                      Edit
                    </button>
                    {u.role === "viewer" || u.role === "analyst" ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "0.35rem 0.65rem", marginLeft: 6 }}
                        onClick={() => {
                          setFormErr("");
                          setPasswordUser(u);
                        }}
                      >
                        Set password
                      </button>
                    ) : null}
                    {!u.is_primary_admin ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: "0.35rem 0.65rem", marginLeft: 6 }}
                          onClick={() => {
                            setFormErr("");
                            setStatusUser(u);
                            setStatusMode(u.is_active ? "deactivate" : "activate");
                          }}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: "0.35rem 0.65rem", marginLeft: 6, color: "var(--danger, #b91c1c)" }}
                          onClick={() => {
                            setFormErr("");
                            setRemoveUser(u);
                          }}
                        >
                          Remove
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Page {data.page} of {data.totalPages} ({data.total} users)
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <button type="button" className="btn btn-ghost" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {createOpen ? (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            load();
          }}
          onError={setFormErr}
          formErr={formErr}
        />
      ) : null}

      {editUser ? (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            setEditUser(null);
            load();
          }}
          onError={setFormErr}
          formErr={formErr}
        />
      ) : null}

      {statusUser ? (
        <StatusToggleModal
          user={statusUser}
          mode={statusMode}
          onClose={() => setStatusUser(null)}
          onDone={() => {
            setStatusUser(null);
            load();
          }}
          onError={setFormErr}
          formErr={formErr}
        />
      ) : null}

      {removeUser ? (
        <RemoveUserModal
          user={removeUser}
          onClose={() => setRemoveUser(null)}
          onDone={() => {
            setRemoveUser(null);
            load();
          }}
          onError={setFormErr}
          formErr={formErr}
        />
      ) : null}

      {passwordUser ? (
        <AdminSetPasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onDone={() => {
            setPasswordUser(null);
            load();
          }}
          onError={setFormErr}
          formErr={formErr}
        />
      ) : null}
    </>
  );
}

function CreateUserModal({ onClose, onSaved, onError, formErr }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    onError("");
    setLoading(true);
    try {
      await usersApi.create({ name, email, password, role, is_active: true });
      onSaved();
    } catch (err) {
      onError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} role="presentation" onClick={onClose}>
      <div style={modal} role="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ fontSize: "1.15rem" }}>
          New team member
        </h2>
        <p className="page-sub" style={{ marginBottom: "1rem" }}>
          They will sign in with this email and password. {PASSWORD_RULES}
        </p>
        {formErr ? <div className="alert-error">{formErr}</div> : null}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Temporary password</label>
            <input type="password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="viewer">Viewer</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved, onError, formErr }) {
  const { user: me } = useAuth();
  const primaryEmailLocked = user.is_primary_admin && !me?.is_primary_admin;
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const hasChanges =
    name !== user.name || email !== user.email || role !== user.role || isActive !== user.is_active;

  const submit = async (e) => {
    e.preventDefault();
    onError("");
    setLoading(true);
    try {
      const body = { currentPassword };
      if (name !== user.name) body.name = name;
      if (email !== user.email) body.email = email;
      if (role !== user.role) body.role = role;
      if (isActive !== user.is_active) body.is_active = isActive;
      await usersApi.patch(user.id, body);
      onSaved();
    } catch (err) {
      onError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} role="presentation" onClick={onClose}>
      <div style={modal} role="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ fontSize: "1.15rem" }}>
          Edit {user.name}
        </h2>
        <p className="page-sub" style={{ marginBottom: "1rem" }}>
          Enter your password to apply changes.
        </p>
        {formErr ? <div className="alert-error">{formErr}</div> : null}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={primaryEmailLocked}
              title={
                primaryEmailLocked ? "Only the primary administrator account can change this email" : undefined
              }
            />
            {primaryEmailLocked ? (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.35rem 0 0" }}>
                Sign in as the primary admin to change this email.
              </p>
            ) : null}
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} disabled={user.is_primary_admin}>
              <option value="viewer">Viewer</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
            {user.is_primary_admin ? (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.35rem 0 0" }}>Primary admin must stay admin.</p>
            ) : null}
          </div>
          <div className="form-group">
            <label>Account active</label>
            <select value={isActive ? "yes" : "no"} onChange={(e) => setIsActive(e.target.value === "yes")} disabled={user.is_primary_admin}>
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </select>
          </div>
          <div className="form-group">
            <label>Your password (confirmation)</label>
            <input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !hasChanges}>
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusToggleModal({ user, mode, onClose, onDone, onError, formErr }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const activating = mode === "activate";

  const submit = async (e) => {
    e.preventDefault();
    onError("");
    setLoading(true);
    try {
      if (activating) {
        await usersApi.patch(user.id, { currentPassword, is_active: true });
      } else {
        await usersApi.deactivate(user.id, currentPassword);
      }
      onDone();
    } catch (err) {
      onError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} role="presentation" onClick={onClose}>
      <div style={modal} role="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ fontSize: "1.15rem" }}>
          {activating ? `Activate ${user.email}?` : `Deactivate ${user.email}?`}
        </h2>
        <p className="page-sub">
          {activating
            ? "They will be able to sign in again. Enter your password to confirm."
            : "They will not be able to sign in until an admin activates them again. Enter your password to confirm."}
        </p>
        {formErr ? <div className="alert-error">{formErr}</div> : null}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Your password</label>
            <input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Working…" : activating ? "Activate" : "Deactivate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RemoveUserModal({ user, onClose, onDone, onError, formErr }) {
  const navigate = useNavigate();
  const { user: me, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const removingSelf = me != null && String(user.id) === String(me.id);

  const submit = async (e) => {
    e.preventDefault();
    onError("");
    setLoading(true);
    try {
      await usersApi.remove(user.id, currentPassword);
      if (removingSelf) {
        logout();
        navigate("/login", { replace: true });
      } else {
        onDone();
      }
    } catch (err) {
      onError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} role="presentation" onClick={onClose}>
      <div style={modal} role="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ fontSize: "1.15rem" }}>
          Remove {user.email}?
        </h2>
        <p className="page-sub">
          {removingSelf
            ? "Your account will be removed from the organization and you will be signed out. This is a soft delete (audit trail kept). Enter your password to confirm."
            : "They will be removed from the team list and cannot sign in. This is a soft delete (audit trail kept). Enter your password to confirm."}
        </p>
        {formErr ? <div className="alert-error">{formErr}</div> : null}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Your password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: "var(--danger, #b91c1c)", borderColor: "transparent" }}>
              {loading ? "Working…" : "Remove user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminSetPasswordModal({ user, onClose, onDone, onError, formErr }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    onError("");
    if (newPassword !== confirm) {
      onError("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      await usersApi.setPassword(user.id, { currentPassword, newPassword });
      onDone();
    } catch (err) {
      onError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} role="presentation" onClick={onClose}>
      <div style={{ ...modal, maxWidth: 460 }} role="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ fontSize: "1.15rem" }}>
          Set password for {user.name}
        </h2>
        <p className="page-sub" style={{ marginBottom: "1rem" }}>
          Only viewers and analysts can be updated from here. {PASSWORD_RULES}
        </p>
        {formErr ? <div className="alert-error">{formErr}</div> : null}
        <form onSubmit={submit}>
          <PasswordField
            label="Your password (admin confirmation)"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <PasswordField
            label={`New password for ${user.email}`}
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
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
