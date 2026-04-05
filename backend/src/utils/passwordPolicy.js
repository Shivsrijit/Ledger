//Shared rules for “strong enough” passwords. We keep this in one place so
//registration, admin-created users, and future reset flows all stay consistent.

const MIN_LEN = 10;
const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

function describeStrongPasswordRules() {
  return `At least ${MIN_LEN} characters, with uppercase, lowercase, a number, and a special character (!@#$… etc.).`;
}


//Returns null if OK, or a short human message if the password is too weak.
function getPasswordStrengthMessage(password) {
  if (typeof password !== "string") return "Password is required.";
  if (password.length < MIN_LEN) return `Use at least ${MIN_LEN} characters.`;
  if (!/[a-z]/.test(password)) return "Add at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Add at least one number.";
  if (!SPECIAL_RE.test(password)) return "Add at least one special character (for example ! @ # $).";
  return null;
}

function assertStrongPassword(password) {
  const msg = getPasswordStrengthMessage(password);
  if (msg) {
    const err = new Error(msg);
    err.statusCode = 400;
    throw err;
  }
}

module.exports = {
  MIN_LEN,
  describeStrongPasswordRules,
  getPasswordStrengthMessage,
  assertStrongPassword
};
