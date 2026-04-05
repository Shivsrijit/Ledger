const { z } = require("zod");
const { getPasswordStrengthMessage } = require("../utils/passwordPolicy");

const strongPasswordField = z.string().superRefine((val, ctx) => {
  const msg = getPasswordStrengthMessage(val);
  if (msg) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg });
  }
});

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: strongPasswordField,
  role: z.enum(["viewer", "analyst", "admin"]).optional(),
  is_active: z.boolean().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: strongPasswordField
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"]
  });

module.exports = { registerSchema, loginSchema, changePasswordSchema };
