const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  db: {
    url: process.env.SUPABASE_DB_URL,
    ssl: process.env.DB_SSL !== "false"
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  }
};

function validateEnv() {
  const required = ["SUPABASE_DB_URL", "JWT_SECRET"];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

module.exports = { env, validateEnv };
