const { query } = require("../config/db");

async function listCategories() {
  return query(
    "SELECT id, name, created_at FROM categories WHERE deleted_at IS NULL ORDER BY name ASC"
  );
}

async function createCategory(name) {
  const rows = await query(
    "INSERT INTO categories (name) VALUES ($1) RETURNING id, name, created_at",
    [name]
  );
  return rows[0];
}

async function deleteCategory(id) {
  const rows = await query(
    "UPDATE categories SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id",
    [id]
  );
  return rows.length > 0;
}

module.exports = { listCategories, createCategory, deleteCategory };
