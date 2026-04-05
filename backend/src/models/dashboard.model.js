/**
 * Dashboard aggregates (summary, categories, trends, recent activity).
 *
 * Business rules (read this before changing queries):
 * - Admin / analyst: full org totals (all non-deleted financial_records).
 * - Viewer: same org-wide numbers on the dashboard — read-only. They do not edit
 *   rows and do not use the Records API; this avoids “all zeros” when admins
 *   entered most transactions. Line-level detail stays with analyst/admin.
 *
 * Everything respects soft-deleted records (`deleted IS NOT TRUE` on financial_records).
 */
const { query } = require("../config/db");

const NOT_DELETED = "deleted IS NOT TRUE";

/** All roles use the same org-wide slice for dashboard cards and charts. */
function buildOrgScope() {
  return { clause: ` WHERE ${NOT_DELETED}`, params: [] };
}

async function getSummary(user) {
  void user;
  const scope = buildOrgScope();
  const rows = await query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expenses
     FROM financial_records${scope.clause}`,
    scope.params
  );
  const totalIncome = Number(rows[0].total_income);
  const totalExpenses = Number(rows[0].total_expenses);
  return {
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_balance: totalIncome - totalExpenses
  };
}

async function getCategoryTotals(user) {
  void user;
  const scope = buildOrgScope();
  const rows = await query(
    `SELECT category, type, SUM(amount) AS total
     FROM financial_records
     ${scope.clause}
     GROUP BY category, type
     ORDER BY total DESC`
  );
  return rows;
}

async function getRecentActivity(limit = 10, user) {
  void user;
  const scope = buildOrgScope();
  const rows = await query(
    `SELECT id, amount, type, category, record_date, notes, created_at
     FROM financial_records
     ${scope.clause}
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

/**
 * Cash-flow trends: monthly buckets (YYYY-MM) or weekly buckets (week start date).
 * `periods` = how many months or weeks back from today to include.
 */
async function getTrends(user, { granularity = "month", periods = 6 } = {}) {
  void user;
  const p = Math.min(Math.max(Number(periods) || 6, 1), 36);

  if (granularity === "week") {
    const rows = await query(
      `SELECT TO_CHAR(date_trunc('week', record_date), 'YYYY-MM-DD') AS period,
              COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS income,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
       FROM financial_records
       WHERE ${NOT_DELETED}
         AND record_date >= (CURRENT_DATE - ($1::int * INTERVAL '1 week'))
       GROUP BY date_trunc('week', record_date)
       ORDER BY date_trunc('week', record_date) ASC`,
      [p]
    );
    return rows;
  }

  const rows = await query(
    `SELECT TO_CHAR(record_date, 'YYYY-MM') AS period,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
     FROM financial_records
     WHERE ${NOT_DELETED}
       AND record_date >= (CURRENT_DATE - ($1::int * INTERVAL '1 month'))
     GROUP BY TO_CHAR(record_date, 'YYYY-MM')
     ORDER BY period ASC`,
    [p]
  );
  return rows;
}

module.exports = {
  getSummary,
  getCategoryTotals,
  getRecentActivity,
  getTrends
};
