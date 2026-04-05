/**
 * Applies backend/sql/seed.sql (sample categories + records).
 * Run after at least one user exists (POST /api/auth/register); created_by uses that user's id.
 * From backend: npm run db:seed
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
require("dotenv").config({ path: envPath });

const { Pool } = require("pg");

async function main() {
  const url = process.env.SUPABASE_DB_URL?.trim();
  if (!url) {
    if (!fs.existsSync(envPath)) {
      console.error(
        `No .env file at:\n  ${envPath}\n\nCreate it:\n  Copy-Item .env.example .env`
      );
    } else {
      console.error(`SUPABASE_DB_URL is missing or empty in:\n  ${envPath}`);
    }
    process.exit(1);
  }

  const seedPath = path.join(__dirname, "..", "sql", "seed.sql");
  const sql = fs.readFileSync(seedPath, "utf8");

  const pool = new Pool({
    connectionString: url,
    ssl: process.env.DB_SSL !== "false" ? { rejectUnauthorized: false } : false
  });

  try {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM users");
    if (!rows[0]?.n) {
      console.error(
        "No users in the database. Register first:\n  POST /api/auth/register\nThen run npm run db:seed again."
      );
      process.exit(1);
    }
    await pool.query(sql);
    console.log("Seed applied successfully:", seedPath);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
