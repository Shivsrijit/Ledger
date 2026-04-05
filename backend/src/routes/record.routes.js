/**
 * Financial records — list (scoped by role), CRUD; delete is soft (archived).
 * Mounted at /api/records
 */
const express = require("express");
const {
  postRecord,
  getRecords,
  getSingleRecord,
  patchRecord,
  removeRecord
} = require("../controllers/record.controller");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");
const {
  createRecordSchema,
  updateRecordSchema,
  listRecordsQuerySchema
} = require("../validation/record.validation");
const { idParamSchema } = require("../validation/common.params.validation");
const { authReadLimiter, authWriteLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.use(authenticate, authReadLimiter);
router.get("/", authorize(["admin", "analyst"]), validate(listRecordsQuerySchema, "query"), getRecords);
router.get("/:id", authorize(["admin", "analyst"]), validate(idParamSchema, "params"), getSingleRecord);
router.post("/", authorize(["admin"]), authWriteLimiter, validate(createRecordSchema), postRecord);
router.patch("/:id", authorize(["admin"]), authWriteLimiter, validate(idParamSchema, "params"), validate(updateRecordSchema), patchRecord);
router.delete("/:id", authorize(["admin"]), authWriteLimiter, validate(idParamSchema, "params"), removeRecord);

module.exports = router;
