//Category catalog — list (all roles), create/delete (admin).
// Mounted at /api/categories

const express = require("express");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");
const {
  getCategories,
  postCategory,
  removeCategory
} = require("../controllers/category.controller");
const { createCategorySchema } = require("../validation/category.validation");
const { authReadLimiter, authWriteLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.use(authenticate, authReadLimiter);
router.get("/", authorize(["admin", "analyst", "viewer"]), getCategories);
router.post("/", authorize(["admin"]), authWriteLimiter, validate(createCategorySchema), postCategory);
router.delete("/:id", authorize(["admin"]), authWriteLimiter, removeCategory);

module.exports = router;
