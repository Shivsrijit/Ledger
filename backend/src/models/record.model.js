const { query } = require("../config/db");

const NOT_DELETED = "deleted IS NOT TRUE";

async function createRecord(payload, createdBy) {
  const { amount, type, category, record_date, notes } = payload;
  const rows = await query(
    "INSERT INTO financial_records (amount, type, category, record_date, notes, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [amount, type, category, record_date, notes ?? null, createdBy]
  );
  return getRecordById(rows[0].id, { role: "admin" });
}

async function getRecordById(id, user) {
  const values = [id];
  let extra = ` AND ${NOT_DELETED}`;
  if (user?.role === "viewer") {
    values.push(user.id);
    extra += ` AND fr.created_by = $2`;
  }
  const rows = await query(
    `SELECT fr.id, fr.amount, fr.type, fr.category, fr.record_date, fr.notes, fr.deleted, fr.created_at, fr.updated_at,
            u.id AS creator_id, u.name AS creator_name
     FROM financial_records fr
     LEFT JOIN users u ON u.id = fr.created_by
     WHERE fr.id = $1${extra}
     LIMIT 1`,
    values
  );
  return rows[0] || null;
}

async function listRecords(filters, user) {
  const where = [`(${NOT_DELETED})`];
  const values = [];

  if (filters.type) {
    where.push(`type = $${values.length + 1}`);
    values.push(filters.type);
  }
  if (filters.category && String(filters.category).trim()) {
    where.push(`category ILIKE $${values.length + 1}`);
    values.push(`%${String(filters.category).trim()}%`);
  }
  if (filters.from) {
    where.push(`record_date >= $${values.length + 1}`);
    values.push(filters.from);
  }
  if (filters.to) {
    where.push(`record_date <= $${values.length + 1}`);
    values.push(filters.to);
  }
  if (filters.search && String(filters.search).trim()) {
    const s = `%${String(filters.search).trim()}%`;
    where.push(`(category ILIKE $${values.length + 1} OR COALESCE(notes, '') ILIKE $${values.length + 1})`);
    values.push(s);
  }
  if (user.role === "viewer") {
    where.push(`created_by = $${values.length + 1}`);
    values.push(user.id);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const limit = Math.min(Number(filters.limit) || 10, 100);
  const page = Math.max(Number(filters.page) || 1, 1);
  const offset = (page - 1) * limit;

  const rows = await query(
    `SELECT id, amount, type, category, record_date, notes, deleted, created_at, updated_at
     FROM financial_records
     ${whereSql}
     ORDER BY record_date DESC, created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  const countRows = await query(`SELECT COUNT(*)::int AS total FROM financial_records ${whereSql}`, values);
  const total = countRows[0].total;
  const totalPages = Math.ceil(total / limit) || 1;

  return { rows, total, page, limit, totalPages };
}

async function updateRecord(id, payload) {
  const keys = Object.keys(payload);
  if (!keys.length) return getRecordById(id, { role: "admin" });
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const vals = keys.map((key) => payload[key]);
  await query(`UPDATE financial_records SET ${setClause} WHERE id = $${keys.length + 1} AND ${NOT_DELETED}`, [...vals, id]);
  return getRecordById(id, { role: "admin" });
}

async function softDeleteRecord(id) {
  const rows = await query(
    `UPDATE financial_records SET deleted = TRUE WHERE id = $1 AND ${NOT_DELETED} RETURNING id`,
    [id]
  );
  return rows.length > 0;
}

module.exports = {
  createRecord,
  getRecordById,
  listRecords,
  updateRecord,
  softDeleteRecord
};
