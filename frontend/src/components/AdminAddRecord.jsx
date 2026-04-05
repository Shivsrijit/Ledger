import { useState } from "react";
import { recordsApi } from "../api/client.js";
import { formatApiError } from "../lib/errors.js";

export default function AdminAddRecord({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    amount: "",
    type: "expense",
    category: "",
    record_date: new Date().toISOString().slice(0, 10),
    notes: ""
  });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await recordsApi.create({
        amount: Number(form.amount),
        type: form.type,
        category: form.category.trim(),
        record_date: form.record_date,
        notes: form.notes.trim() || null
      });
      setForm((f) => ({ ...f, amount: "", category: "", notes: "" }));
      setOpen(false);
      onCreated?.();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 className="card-title" style={{ marginBottom: "0.25rem" }}>
            Add transaction
          </h2>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>Admin only creates a new ledger entry.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen((o) => !o)}>
          {open ? "Close form" : "New entry"}
        </button>
      </div>
      {open && (
        <form onSubmit={submit} style={{ marginTop: "1.25rem", maxWidth: 480 }}>
          {error ? <div className="alert-error">{error}</div> : null}
          <div className="form-group">
            <label htmlFor="amt">Amount</label>
            <input
              id="amt"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="typ">Type</label>
            <select id="typ" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="cat">Category</label>
            <input
              id="cat"
              required
              placeholder="e.g. Groceries"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="dt">Date</label>
            <input id="dt" type="date" required value={form.record_date} onChange={(e) => setForm((f) => ({ ...f, record_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <input id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Save transaction"}
          </button>
        </form>
      )}
    </div>
  );
}
