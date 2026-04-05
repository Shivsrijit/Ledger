/**
 * Applies backend/sql/schema.sql using the same DB URL as the app.
 * Run from backend: npm run db:schema
 * No need to paste SQL in the Supabase dashboard.
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
        `No .env file at:\n  ${envPath}\n\nCreate it from .env.example:\n  Copy-Item .env.example .env\nThen set SUPABASE_DB_URL to your Supabase connection string.`
      );
    } else {
      console.error(
        `SUPABASE_DB_URL is missing or empty in:\n  ${envPath}\n\nAdd a line like:\n  SUPABASE_DB_URL=postgresql://postgres.xxx:PASSWORD@aws-0-xxx.pooler.supabase.com:6543/postgres`
      );
    }
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  const pool = new Pool({
    connectionString: url,
    ssl: process.env.DB_SSL !== "false" ? { rejectUnauthorized: false } : false
  });

  try {
    // Postgres simple-query mode accepts multiple statements in one string (incl. DO $$ ... $$ blocks).
    await pool.query(sql);
    console.log("Schema applied successfully:", schemaPath);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
