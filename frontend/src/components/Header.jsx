import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const linkStyle = ({ isActive }) => ({
  fontWeight: isActive ? 600 : 500,
  color: isActive ? "var(--text)" : "var(--text-muted)",
  textDecoration: "none",
  fontSize: "0.9375rem",
  padding: "0.35rem 0",
  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
  marginBottom: "-1px"
});

export default function Header() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0.75rem 1.25rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "1.125rem", letterSpacing: "-0.02em" }}>Ledger</span>
          <nav style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
            <NavLink to="/" end style={linkStyle}>
              Overview
            </NavLink>
            {user?.role === "admin" || user?.role === "analyst" ? (
              <NavLink to="/records" style={linkStyle}>
                Records
              </NavLink>
            ) : null}
            {isAdmin ? (
              <NavLink to="/team" style={linkStyle}>
                Team
              </NavLink>
            ) : null}
            <NavLink to="/account/password" style={linkStyle}>
              Password
            </NavLink>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }} className="hide-sm">
            {user?.name} · <span style={{ textTransform: "capitalize" }}>{user?.role}</span>
            {user?.is_primary_admin ? " · primary" : ""}
          </span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
