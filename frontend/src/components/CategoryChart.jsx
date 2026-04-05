import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const EXPENSE = "#b45309";
const INCOME = "#1d7a4c";

const fmt = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function CategoryChart({ rows }) {
  const expenseByCat = {};
  const incomeByCat = {};
  for (const row of rows || []) {
    const t = Number(row.total) || 0;
    if (row.type === "expense") expenseByCat[row.category] = (expenseByCat[row.category] || 0) + t;
    else incomeByCat[row.category] = (incomeByCat[row.category] || 0) + t;
  }

  const expenseTop = Object.entries(expenseByCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const incomeTop = Object.entries(incomeByCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (!expenseTop.length && !incomeTop.length) {
    return <p className="muted-hint">No category data yet.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {expenseTop.length > 0 && (
        <div>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)" }}>
            Top expenses by category
          </p>
          <div style={{ width: "100%", height: Math.max(200, expenseTop.length * 36) }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={expenseTop} margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaef" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
                  {expenseTop.map((_, i) => (
                    <Cell key={i} fill={EXPENSE} fillOpacity={1 - i * 0.06} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {incomeTop.length > 0 && (
        <div>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)" }}>
            Income by category
          </p>
          <div style={{ width: "100%", height: Math.max(180, incomeTop.length * 32) }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={incomeTop} margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaef" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Bar dataKey="value" name="Amount" fill={INCOME} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
