/**
 * Users table access. Anyone with `deleted = true` is treated as gone: no login,
 * not counted for “first user” bootstrap, and omitted from team lists unless we
 * add an admin “archived” view later.
 */
const { query } = require("../config/db");

const PUBLIC_USER_FIELDS =
  "id, name, email, role, is_active, is_primary_admin, created_at, updated_at";

const ACTIVE_USER = "(COALESCE(deleted, FALSE) IS NOT TRUE)";

async function findUserByEmail(email) {
  const rows = await query(
    `SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1::text)) AND ${ACTIVE_USER} LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const rows = await query(
    `SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = $1 AND ${ACTIVE_USER} LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findUserWithPasswordById(id) {
  const rows = await query(`SELECT * FROM users WHERE id = $1 AND ${ACTIVE_USER} LIMIT 1`, [id]);
  return rows[0] || null;
}

async function countUsers() {
  const rows = await query(`SELECT COUNT(*)::int AS total FROM users WHERE ${ACTIVE_USER}`);
  return rows[0].total;
}

async function createUser({ name, email, password_hash, role, is_active, is_primary_admin = false }) {
  const rows = await query(
    "INSERT INTO users (name, email, password_hash, role, is_active, is_primary_admin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [name, email, password_hash, role, is_active, is_primary_admin]
  );
  return findUserById(rows[0].id);
}

async function listUsers({ page = 1, limit = 10, search } = {}) {
  const offset = (page - 1) * limit;
  const values = [];
  let whereSql = `WHERE ${ACTIVE_USER}`;
  if (search && String(search).trim()) {
    values.push(`%${String(search).trim()}%`);
    whereSql += ` AND (name ILIKE $1 OR email ILIKE $1)`;
  }

  const limitPlaceholder = values.length + 1;
  const offsetPlaceholder = values.length + 2;
  const rows = await query(
    `SELECT ${PUBLIC_USER_FIELDS} FROM users ${whereSql} ORDER BY created_at DESC LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`,
    [...values, limit, offset]
  );
  const countRows = await query(`SELECT COUNT(*)::int AS total FROM users ${whereSql}`, values);
  const total = countRows[0].total;
  const totalPages = Math.ceil(total / limit) || 1;
  return { rows, page, limit, total, totalPages };
}

async function updateUser(id, fields) {
  const allowed = ["name", "role", "is_active", "email"];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k) && fields[k] !== undefined);
  if (!keys.length) return findUserById(id);

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const vals = keys.map((key) => fields[key]);
  await query(`UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1}`, [...vals, id]);
  return findUserById(id);
}

async function updateUserPassword(id, password_hash) {
  await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [password_hash, id]);
}

async function deactivateUser(id) {
  const rows = await query(
    `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 AND ${ACTIVE_USER} RETURNING id`,
    [id]
  );
  return rows.length > 0;
}

/** Soft delete: user disappears from team list and cannot sign in. */
async function softRemoveUser(id) {
  const rows = await query(
    `UPDATE users
     SET deleted = TRUE,
         deleted_at = NOW(),
         is_active = FALSE,
         updated_at = NOW()
     WHERE id = $1
       AND is_primary_admin IS NOT TRUE
       AND ${ACTIVE_USER}
     RETURNING id`,
    [id]
  );
  return rows.length > 0;
}

async function emailTakenByOther(email, excludeUserId) {
  const rows = await query(
    `SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1::text)) AND id <> $2 AND ${ACTIVE_USER} LIMIT 1`,
    [email, excludeUserId]
  );
  return rows.length > 0;
}

module.exports = {
  findUserByEmail,
  findUserById,
  findUserWithPasswordById,
  countUsers,
  createUser,
  listUsers,
  updateUser,
  updateUserPassword,
  deactivateUser,
  softRemoveUser,
  emailTakenByOther
};
