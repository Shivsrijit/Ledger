// Normalizes JWT / request user so DB comparisons work (pg often returns bigint id as string).
// Fixes viewers seeing empty dashboards when created_by (bigint) didn't match string id from JWT.

function normalizeAuthUser(payload) {
  if (!payload || typeof payload !== "object") {
    return { id: null, role: "", email: "" };
  }
  const rawId = payload.id;
  let id = rawId;
  if (rawId != null && rawId !== "") {
    const n = Number(rawId);
    id = Number.isSafeInteger(n) ? n : String(rawId);
  } else {
    id = null;
  }
  const role = String(payload.role || "")
    .trim()
    .toLowerCase();
  const email = String(payload.email || "").trim();
  return { id, role, email };
}

module.exports = { normalizeAuthUser };
