const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const jsonMessage = (msg) => ({ success: false, message: msg });

/** Skip health checks so monitoring does not consume quota */
function skipHealthCheck(req) {
  return req.method === "GET" && (req.originalUrl === "/api/health" || req.originalUrl.endsWith("/health"));
}

/**
 * Broad limit for all /api traffic (per IP). High ceiling; stricter limits apply on auth and writes.
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX) || 800,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHealthCheck,
  message: jsonMessage("Too many requests from this network. Please try again later.")
});

/** Login — tight per IP */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage("Too many login attempts. Wait a few minutes and try again.")
});

/** Registration — tighter (abuse / enumeration) */
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REGISTER_MAX) || 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage("Too many registration attempts. Try again later.")
});

/**
 * After JWT is verified: per-user + IP bucket for read-heavy endpoints.
 */
function authenticatedReadLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: Number(process.env.RATE_LIMIT_AUTH_READ_MAX) || 150,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      if (req.user?.id != null) return `user:${req.user.id}`;
      return ipKeyGenerator(req.ip || "unknown");
    },
    message: jsonMessage("Too many requests. Slow down for a moment.")
  });
}

/**
 * Mutations (create/update/delete) — stricter per user.
 */
function authenticatedWriteLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: Number(process.env.RATE_LIMIT_AUTH_WRITE_MAX) || 45,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      if (req.user?.id != null) return `write:${req.user.id}`;
      return ipKeyGenerator(req.ip || "unknown");
    },
    message: jsonMessage("Too many changes in a short time. Please wait before retrying.")
  });
}

const authReadLimiter = authenticatedReadLimiter();
const authWriteLimiter = authenticatedWriteLimiter();

module.exports = {
  apiRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  authReadLimiter,
  authWriteLimiter,
  authenticatedReadLimiter,
  authenticatedWriteLimiter
};
