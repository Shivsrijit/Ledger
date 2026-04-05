import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { authApi, setToken, setUser, getStoredUser } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getStoredUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setReady(true);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUserState(res.data);
        setUser(res.data);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        setUserState(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, user: u } = res.data;
    setToken(token);
    setUser(u);
    setUserState(u);
    return u;
  };

  const register = async (name, email, password) => {
    await authApi.register({ name, email, password });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setUserState(null);
  };

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      register,
      logout,
      isAdmin: user?.role === "admin",
      isAnalyst: user?.role === "analyst",
      // Dashboard charts and category breakdown: viewers see the same org-wide read-only aggregates.
      canSeeInsights:
        user?.role === "admin" || user?.role === "analyst" || user?.role === "viewer"
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
