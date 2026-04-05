/**
 * Runs SQL files in sql/migrations in alphabetical order (001…, 002…).
 * Safe to re-run: migrations should use IF NOT EXISTS where needed.
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const url = process.env.SUPABASE_DB_URL?.trim();
  if (!url) {
    console.error("Missing SUPABASE_DB_URL in backend/.env");
    process.exit(1);
  }

  const dir = path.join(__dirname, "..", "sql", "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (!files.length) {
    console.error("No .sql files in", dir);
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: process.env.DB_SSL !== "false" ? { rejectUnauthorized: false } : false
  });

  try {
    for (const file of files) {
      const full = path.join(dir, file);
      const sql = fs.readFileSync(full, "utf8");
      await pool.query(sql);
      console.log("Migration OK:", file);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
