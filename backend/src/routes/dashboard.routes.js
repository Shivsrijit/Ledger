
// Dashboard aggregates — summary, categories, trends, recent (RBAC per handler).
// Mounted at /api/dashboard

const express = require("express");
const { summary, categories, recent, trends } = require("../controllers/dashboard.controller");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");
const { trendsQuerySchema } = require("../validation/dashboard.validation");
const { authReadLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.use(authenticate, authReadLimiter);
router.get("/summary", authorize(["admin", "analyst", "viewer"]), summary);
router.get("/recent", authorize(["admin", "analyst", "viewer"]), recent);
// Viewers get the same read-only breakdown as analysts (org-wide, non-deleted rows only).
router.get("/categories", authorize(["admin", "analyst", "viewer"]), categories);
router.get("/trends", authorize(["admin", "analyst", "viewer"]), validate(trendsQuerySchema, "query"), trends);

module.exports = router;
