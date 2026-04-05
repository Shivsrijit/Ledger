export default function StatCard({ label, value, sub, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "var(--surface-elevated)", accent: "var(--text)" },
    income: { bg: "var(--income-soft)", accent: "var(--income)" },
    expense: { bg: "var(--expense-soft)", accent: "var(--expense)" },
    net: { bg: "var(--net-soft)", accent: "var(--net)" }
  };
  const t = tones[tone] || tones.neutral;

  return (
    <div className="card" style={{ background: t.bg, borderColor: "var(--border)" }}>
      <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
        {label}
      </p>
      <p style={{ margin: "0.35rem 0 0", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", color: t.accent }}>
        {value}
      </p>
      {sub ? (
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>{sub}</p>
      ) : null}
    </div>
  );
}
