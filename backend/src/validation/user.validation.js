const { z } = require("zod");
const { getPasswordStrengthMessage } = require("../utils/passwordPolicy");

const strongPasswordField = z.string().superRefine((val, ctx) => {
  const msg = getPasswordStrengthMessage(val);
  if (msg) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg });
  }
});

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: strongPasswordField,
  role: z.enum(["viewer", "analyst", "admin"]),
  is_active: z.boolean().optional()
});

const patchUserSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your password to confirm this change"),
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    role: z.enum(["viewer", "analyst", "admin"]).optional(),
    is_active: z.boolean().optional()
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.role !== undefined ||
      data.is_active !== undefined,
    { message: "Provide at least one field to update (name, email, role, or active status)." }
  );

const deactivateUserSchema = z.object({
  currentPassword: z.string().min(1, "Enter your password to confirm deactivation")
});

const softRemoveUserSchema = z.object({
  currentPassword: z.string().min(1, "Enter your password to confirm removal")
});

/** Admin sets another user's password (viewers/analysts only — not other admins). */
const adminSetUserPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your password to confirm this change"),
    newPassword: strongPasswordField
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from your admin password (the one you typed above).",
    path: ["newPassword"]
  });

module.exports = {
  createUserSchema,
  patchUserSchema,
  deactivateUserSchema,
  softRemoveUserSchema,
  adminSetUserPasswordSchema
};
