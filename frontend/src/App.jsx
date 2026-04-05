import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Records from "./pages/Records.jsx";
import Team from "./pages/Team.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function AnalystOrAdminRoute({ children }) {
  const { user } = useAuth();
  const role = user?.role;
  if (role !== "admin" && role !== "analyst") return <Navigate to="/" replace />;
  return children;
}

function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="app-shell" style={{ alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/account/password" element={<ChangePassword />} />
        <Route
          path="/records"
          element={
            <AnalystOrAdminRoute>
              <Records />
            </AnalystOrAdminRoute>
          }
        />
        <Route
          path="/team"
          element={
            <AdminRoute>
              <Team />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
