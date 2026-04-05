const { Pool } = require("pg");
const { env } = require("./env");

// Removes SSL-related params from connection string if present
// (sometimes they conflict with pg config)
function stripSslQueryParams(urlString) {
  if (!urlString) return urlString;
  try {
    const u = new URL(urlString);
    ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"].forEach((k) => u.searchParams.delete(k));
    const q = u.searchParams.toString();
    u.search = q ? `?${q}` : "";
    return u.toString();
  } catch {
    return urlString;
  }
}
// cleaned connection string only if SSL is enabled
const connectionString = env.db.ssl ? stripSslQueryParams(env.db.url) : env.db.url;

// to keep timeout within a safe range (5s to 120s)
const connectTimeout = Math.min(
  Math.max(Number(process.env.DB_CONNECT_TIMEOUT_MS) || 25_000, 5_000),
  120_000
);

// creating connection pool
const pool = new Pool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: connectTimeout,
  idleTimeoutMillis: 30_000,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false
});

// simple check to verify DB connection works
async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

// helper to run queries
async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

module.exports = { pool, query, testConnection };
