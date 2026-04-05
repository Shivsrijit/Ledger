import { useEffect, useRef, useState } from "react";
import { recordsApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatApiError } from "../lib/errors.js";

const money = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n) || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  return typeof d === "string" ? d.slice(0, 10) : d;
};

const SEARCH_DEBOUNCE_MS = 400;

export default function Records() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [archivingId, setArchivingId] = useState(null);
  const lastDebouncedSearchRef = useRef(debouncedSearch);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = search.trim();
      if (lastDebouncedSearchRef.current === next) return;
      lastDebouncedSearchRef.current = next;
      setDebouncedSearch(next);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setError("");
    (async () => {
      try {
        const res = await recordsApi.list({
          page,
          limit: 10,
          search: debouncedSearch || undefined,
          category: category.trim() || undefined,
          type: type || undefined,
          from: from || undefined,
          to: to || undefined
        });
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, tick, debouncedSearch]);

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    setTick((t) => t + 1);
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(category.trim()) ||
    Boolean(type) ||
    Boolean(from) ||
    Boolean(to) ||
    Boolean(debouncedSearch.trim());

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setType("");
    setFrom("");
    setTo("");
    lastDebouncedSearchRef.current = "";
    setDebouncedSearch("");
    setPage(1);
    setTick((t) => t + 1);
  };

  const archive = async (id) => {
    if (!confirm("Archive this record? It will disappear from lists and totals.")) return;
    setArchivingId(id);
    setError("");
    try {
      await recordsApi.archive(id);
      setTick((t) => t + 1);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <>
      <h1 className="page-title">Records</h1>
      <p className="page-sub">Search notes or category, filter by dates, browse 10 per page.</p>

      {error ? <div className="alert-error">{error}</div> : null}

      <form className="card" onSubmit={applyFilters} style={{ marginBottom: "1rem" }}>
        <h2 className="card-title">Search & filters</h2>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr", maxWidth: 900 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="s">Search (notes or category)</label>
            <input id="s" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. rent, invoice…" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Category contains</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Any</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
            <button type="submit" className="btn btn-primary">
              Apply filters
            </button>
            <button type="button" className="btn btn-ghost" disabled={!hasActiveFilters} onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Type</th>
                <th>Notes</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                {isAdmin ? <th style={{ width: 100 }} /> : null}
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((r) => (
                <tr key={r.id}>
                  <td>{fmtDate(r.record_date)}</td>
                  <td>{r.category}</td>
                  <td>
                    <span className={`badge badge-${r.type}`}>{r.type}</span>
                  </td>
                  <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.notes || ""}>
                    {r.notes || "—"}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{money(r.amount)}</td>
                  {isAdmin ? (
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.8125rem" }}
                        disabled={archivingId === r.id}
                        onClick={() => archive(r.id)}
                      >
                        {archivingId === r.id ? "…" : "Archive"}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data?.rows?.length ? <p className="muted-hint" style={{ border: "none", marginTop: "0.5rem" }}>No records match these filters.</p> : null}
        {data && data.totalPages > 0 ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Page {data.page} of {data.totalPages} · {data.total} records
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
    </>
  );
}
