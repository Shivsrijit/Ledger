const { z } = require("zod");

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional()
});

module.exports = { listUsersQuerySchema };
