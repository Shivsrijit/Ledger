import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { dashboardApi } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import TrendsChart from "../components/TrendsChart.jsx";
import CategoryChart from "../components/CategoryChart.jsx";
import RecentActivity from "../components/RecentActivity.jsx";
import AdminAddRecord from "../components/AdminAddRecord.jsx";
import { formatApiError } from "../lib/errors.js";

const money = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(n) || 0);

export default function Dashboard() {
  const { user, canSeeInsights, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [trendGranularity, setTrendGranularity] = useState("month");
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const trendPeriods = trendGranularity === "week" ? 12 : 6;

  useEffect(() => {
    let cancelled = false;
    setLoadError("");

    async function load() {
      try {
        const [sumRes, recRes] = await Promise.all([dashboardApi.summary(), dashboardApi.recent(10)]);
        if (cancelled) return;
        setSummary(sumRes.data);
        setRecent(recRes.data || []);

        if (canSeeInsights) {
          const [catRes, trendRes] = await Promise.all([
            dashboardApi.categories(),
            dashboardApi.trends({ granularity: trendGranularity, periods: trendPeriods })
          ]);
          if (cancelled) return;
          setCategories(catRes.data || []);
          setTrends(trendRes.data || []);
        } else {
          setCategories([]);
          setTrends([]);
        }
      } catch (e) {
        if (!cancelled) setLoadError(formatApiError(e));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [canSeeInsights, refreshKey, trendGranularity, trendPeriods]);

  const roleLabel = user?.role === "viewer" ? "Organization overview (read-only)" : "Organization overview";

  return (
    <>
      <h1 className="page-title">Overview</h1>
      <p className="page-sub">
        {roleLabel} · Signed in as <strong>{user?.name}</strong>
        {user?.role === "viewer" ? (
          <span style={{ display: "block", marginTop: "0.35rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            You see the same totals and trends as the team, but cannot browse line-level records or change data.
          </span>
        ) : null}
      </p>

      {loadError ? <div className="alert-error">{loadError}</div> : null}

      <div className="grid-stats">
        <StatCard label="Total income" value={summary ? money(summary.total_income) : "—"} tone="income" />
        <StatCard label="Total expenses" value={summary ? money(summary.total_expenses) : "—"} tone="expense" />
        <StatCard
          label="Net balance"
          value={summary ? money(summary.net_balance) : "—"}
          tone="net"
          sub={summary && summary.net_balance >= 0 ? "Positive cash flow" : summary ? "Review spending" : undefined}
        />
      </div>

      <div className="grid-charts">
        <div className="card">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              Cash flow trend
            </h2>
            {canSeeInsights ? (
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  type="button"
                  className={trendGranularity === "month" ? "btn btn-primary" : "btn btn-ghost"}
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem" }}
                  onClick={() => setTrendGranularity("month")}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={trendGranularity === "week" ? "btn btn-primary" : "btn btn-ghost"}
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem" }}
                  onClick={() => setTrendGranularity("week")}
                >
                  Weekly
                </button>
              </div>
            ) : null}
          </div>
          {canSeeInsights ? (
            <TrendsChart data={trends} granularity={trendGranularity} />
          ) : (
            <p className="muted-hint">Charts load after sign-in.</p>
          )}
        </div>
        <div className="card">
          <h2 className="card-title">Category mix</h2>
          {canSeeInsights ? (
            <CategoryChart rows={categories} />
          ) : (
            <p className="muted-hint">Charts load after sign-in.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <h2 className="card-title">Recent activity</h2>
        <RecentActivity rows={recent} />
      </div>

      {isAdmin ? <AdminAddRecord onCreated={reload} /> : null}
    </>
  );
}
