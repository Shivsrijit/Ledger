//Turns API validation payloads into a single readable string for the UI.

export function formatApiError(err) {
  if (!err) return "Something went wrong.";
  const base = err.message || "Request failed.";
  const fe = err.details?.fieldErrors;
  if (!fe || typeof fe !== "object") return base;
  const parts = Object.entries(fe).flatMap(([key, msgs]) => (Array.isArray(msgs) ? msgs.map((m) => `${key}: ${m}`) : []));
  if (!parts.length) return base;
  return `${base} ${parts.join(" · ")}`;
}
