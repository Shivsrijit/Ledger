const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const apiRoutes = require("./routes");
const { apiRateLimiter } = require("./middleware/rateLimit");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Behind Render, Railway, etc. so rate limits and req.ip see the real client (set TRUST_PROXY=1 in env).
if (process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Order matters here: security headers first, then parse JSON, then attaching routes.
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Finance dashboard API — use /api routes",
    try: {
      health: "/api/health",
      register: "POST /api/auth/register",
      login: "POST /api/auth/login"
    }
  });
});

// Everything under /api shares a loose per-IP limit; tighter limits sit on auth + writes inside routers.
app.use("/api", apiRateLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
