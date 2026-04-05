const { z } = require("zod");

const trendsQuerySchema = z.object({
  granularity: z.enum(["month", "week"]).optional(),
  periods: z.coerce.number().int().min(1).max(36).optional()
});

module.exports = { trendsQuerySchema };
