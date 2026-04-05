const { ApiError } = require("../utils/apiError");

/**
 * Simple role gate: runs after `authenticate` so `req.user.role` is set.
 * This is the closest thing we have to a “decorator” in Express — a function
 * that returns middleware. Keep roles explicit at the route so you can see
 * who may call an endpoint without digging into the controller.
 */
function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission for this action"));
    }
    next();
  };
}

module.exports = { authorize };
