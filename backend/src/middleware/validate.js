const { ZodError } = require("zod");
const { ApiError } = require("../utils/apiError");

function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(400, "Validation failed", error.flatten()));
      }
      next(error);
    }
  };
}

module.exports = { validate };
