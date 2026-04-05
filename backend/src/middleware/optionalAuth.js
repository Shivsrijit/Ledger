const { verifyToken } = require("../utils/jwt");
const { normalizeAuthUser } = require("../utils/authUser");

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  try {
    const token = header.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = normalizeAuthUser(decoded);
    if (req.user.id == null || !req.user.role) req.user = null;
  } catch (error) {
    req.user = null;
  }
  next();
}

module.exports = { optionalAuth };
