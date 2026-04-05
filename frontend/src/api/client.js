// const API = import.meta.env.VITE_API_URL || "/api";
const API = "https://ledger-u9p6.onrender.com/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || res.statusText || "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data;
}

export function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export function setUser(user) {
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export const authApi = {
  login: (body) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  me: () => apiFetch("/auth/me"),
  changePassword: (body) => apiFetch("/auth/password", { method: "PATCH", body: JSON.stringify(body) })
};

export const dashboardApi = {
  summary: () => apiFetch("/dashboard/summary"),
  categories: () => apiFetch("/dashboard/categories"),
  /** @param {{ granularity?: 'month' | 'week', periods?: number }} opts */
  trends: (opts = {}) => {
    const q = new URLSearchParams();
    q.set("granularity", opts.granularity || "month");
    q.set("periods", String(opts.periods ?? (opts.granularity === "week" ? 12 : 6)));
    return apiFetch(`/dashboard/trends?${q.toString()}`);
  },
  recent: (limit = 8) => apiFetch(`/dashboard/recent?limit=${limit}`)
};

export const recordsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();
    return apiFetch(`/records${q ? `?${q}` : ""}`);
  },
  create: (body) => apiFetch("/records", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/records/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  archive: (id) => apiFetch(`/records/${id}`, { method: "DELETE" })
};

export const usersApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();
    return apiFetch(`/users${q ? `?${q}` : ""}`);
  },
  get: (id) => apiFetch(`/users/${id}`),
  create: (body) => apiFetch("/users", { method: "POST", body: JSON.stringify(body) }),
  patch: (id, body) => apiFetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deactivate: (id, currentPassword) =>
    apiFetch(`/users/${id}`, { method: "DELETE", body: JSON.stringify({ currentPassword }) }),
  /** Soft-delete: user cannot sign in and disappears from the team list. */
  remove: (id, currentPassword) =>
    apiFetch(`/users/${id}/remove`, { method: "POST", body: JSON.stringify({ currentPassword }) }),
  /** Admin: set password for viewer/analyst (not for another admin). */
  setPassword: (id, body) => apiFetch(`/users/${id}/password`, { method: "PATCH", body: JSON.stringify(body) })
};
