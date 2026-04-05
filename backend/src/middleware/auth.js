const { verifyToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiError");
const { normalizeAuthUser } = require("../utils/authUser");

/** Verifies Bearer JWT and attaches a normalized `req.user` for downstream RBAC and queries. */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing or invalid authorization token"));
  }

  try {
    const token = header.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = normalizeAuthUser(decoded);
    if (req.user.id == null || !req.user.role) {
      return next(new ApiError(401, "Invalid token payload"));
    }
    next();
  } catch (error) {
    next(new ApiError(401, "Token is invalid or expired"));
  }
}

module.exports = { authenticate };
