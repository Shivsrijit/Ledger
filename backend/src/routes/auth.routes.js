// Auth routes — register, login, current user.
// Router is mounted at /api/auth by routes/index.js

const express = require("express");
const { register, login, me, changePassword } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const { optionalAuth } = require("../middleware/optionalAuth");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema, changePasswordSchema } = require("../validation/auth.validation");
const { loginRateLimiter, registerRateLimiter, authWriteLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// Register endpoint is guarded in controller:
// first account is public and becomes admin, rest require admin token.
router.post("/register", registerRateLimiter, optionalAuth, validate(registerSchema), register);
router.post("/login", loginRateLimiter, validate(loginSchema), login);
router.get("/me", authenticate, me);
router.patch("/password", authenticate, authWriteLimiter, validate(changePasswordSchema), changePassword);

module.exports = router;
