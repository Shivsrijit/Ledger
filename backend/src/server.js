const app = require("./app");
const { env, validateEnv } = require("./config/env");
const { testConnection } = require("./config/db");

async function bootstrap() {
  validateEnv();
  await testConnection();
  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error.message);
  const msg = String(error.message || "");
  const timedOut =
    error.code === "ETIMEDOUT" ||
    /timeout/i.test(msg) ||
    msg.includes("Connection terminated");

  if (timedOut) {
    console.error(`
Database connection timed out — nothing answered at the host/port in SUPABASE_DB_URL. Check:

  • Supabase dashboard: is the project **paused**? Resume it (free tier pauses after inactivity).
  • **Network**: VPN, corporate firewall, or school Wi‑Fi often block outbound **5432** / **6543**. Try another network or disable VPN.
  • **URI**: In Supabase → Project Settings → Database, copy **URI** again. Password must be **URL-encoded** (@ → %40, # → %23).
  • **Pooler vs direct**: If port **6543** (pooler) fails, try **Direct connection** on port **5432** (host like db.xxxxx.supabase.co), or the reverse.
  • **SSL**: Keep DB_SSL=true for Supabase (default). Use DB_SSL=false only for local Postgres without TLS.
  • Optional: raise wait time with DB_CONNECT_TIMEOUT_MS=60000 in backend/.env

Host/port are taken only from SUPABASE_DB_URL — the API cannot connect if your machine cannot reach that address.
`);
  } else if (error.code === "ECONNRESET" || msg.includes("ECONNRESET")) {
    console.error(`
Database connection was reset before the query finished. Typical fixes:
  • Copy the URI again from Supabase → Project Settings → Database → Connection string (URI).
  • If you use the pooler (port 6543), confirm the password is URL-encoded (@ → %40, # → %23, etc.).
  • Try the "Direct connection" URI (port 5432, host db.<project-ref>.supabase.co) if the pooler fails on your network/VPN.
  • Keep DB_SSL=true in backend/.env (or omit DB_SSL; only set DB_SSL=false if you use local Postgres without TLS).
`);
  }
  process.exit(1);
});
