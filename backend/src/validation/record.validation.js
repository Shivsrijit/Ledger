const { z } = require("zod");

const recordType = z.enum(["income", "expense"]);

const dateString = z
  .string()
  .min(1)
  .refine(
    (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isNaN(Date.parse(s)),
    { message: "Use a valid date (YYYY-MM-DD)" }
  );

const createRecordSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  type: recordType,
  category: z.string().min(2).max(100),
  record_date: dateString,
  notes: z.string().max(500).optional().nullable()
});

const updateRecordSchema = z
  .object({
    amount: z.number().positive().optional(),
    type: recordType.optional(),
    category: z.string().min(2).max(100).optional(),
    record_date: dateString.optional(),
    notes: z.string().max(500).optional().nullable()
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required"
  });

const listRecordsQuerySchema = z.object({
  type: recordType.optional(),
  category: z.string().max(100).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

module.exports = { createRecordSchema, updateRecordSchema, listRecordsQuerySchema };
