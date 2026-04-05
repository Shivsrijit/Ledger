import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const fmt = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** X-axis label: API sends `period` (YYYY-MM or week start YYYY-MM-DD). Legacy: `month`. */
function rowLabel(row) {
  return row.period || row.month || "";
}

export default function TrendsChart({ data, granularity = "month" }) {
  if (!data?.length) {
    return <p className="muted-hint">No trend data for this range.</p>;
  }

  const chartData = data.map((row) => ({
    label: rowLabel(row),
    income: Number(row.income) || 0,
    expense: Number(row.expense) || 0
  }));

  const tickFormatter = (v) => {
    if (granularity === "week" && typeof v === "string" && v.length >= 10) {
      return v.slice(5, 10);
    }
    return v;
  };

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d7a4c" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#1d7a4c" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b45309" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#b45309" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8eaef" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            dy={6}
            tickFormatter={tickFormatter}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            width={44}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow)",
              fontSize: 13
            }}
            formatter={(value) => fmt(value)}
          />
          <Area type="monotone" dataKey="income" name="Income" stroke="#1d7a4c" fill="url(#gIncome)" strokeWidth={2} />
          <Area type="monotone" dataKey="expense" name="Expenses" stroke="#b45309" fill="url(#gExpense)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
