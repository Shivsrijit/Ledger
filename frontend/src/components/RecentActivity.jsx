const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n) || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  return x.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function RecentActivity({ rows }) {
  if (!rows?.length) {
    return <p className="muted-hint">No recent activity.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Type</th>
            <th style={{ textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{fmtDate(r.record_date)}</td>
              <td>{r.category}</td>
              <td>
                <span className={`badge badge-${r.type}`}>{r.type}</span>
              </td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtMoney(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
