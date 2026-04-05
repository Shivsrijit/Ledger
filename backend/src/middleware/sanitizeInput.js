/**
 * Trims leading/trailing whitespace on all string fields in JSON bodies.
 * Applied before validation so emails/passwords with accidental spaces still work.
 */
function trimDeep(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(trimDeep);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) {
      out[k] = trimDeep(value[k]);
    }
    return out;
  }
  return value;
}

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = trimDeep(req.body);
  }
  next();
}

module.exports = { sanitizeInput };
