/**
 * User admin routes — list, create, read, update, deactivate, soft-remove (admin only).
 * Mounted at /api/users
 */
const express = require("express");
const {
  getUsers,
  getUserById,
  createUserByAdmin,
  patchUser,
  deleteUser,
  removeUser,
  changeUserPassword
} = require("../controllers/user.controller");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");
const {
  createUserSchema,
  patchUserSchema,
  deactivateUserSchema,
  softRemoveUserSchema,
  adminSetUserPasswordSchema
} = require("../validation/user.validation");
const { listUsersQuerySchema } = require("../validation/user.query.validation");
const { idParamSchema } = require("../validation/common.params.validation");
const { authReadLimiter, authWriteLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.use(authenticate, authorize(["admin"]), authReadLimiter);

router.get("/", validate(listUsersQuerySchema, "query"), getUsers);
router.post("/", authWriteLimiter, validate(createUserSchema), createUserByAdmin);
// More specific routes first so ":id" never captures "remove".
router.post(
  "/:id/remove",
  authWriteLimiter,
  validate(idParamSchema, "params"),
  validate(softRemoveUserSchema, "body"),
  removeUser
);
router.patch(
  "/:id/password",
  authWriteLimiter,
  validate(idParamSchema, "params"),
  validate(adminSetUserPasswordSchema, "body"),
  changeUserPassword
);
router.get("/:id", validate(idParamSchema, "params"), getUserById);
router.patch("/:id", authWriteLimiter, validate(idParamSchema, "params"), validate(patchUserSchema, "body"), patchUser);
router.delete("/:id", authWriteLimiter, validate(idParamSchema, "params"), validate(deactivateUserSchema, "body"), deleteUser);

module.exports = router;
