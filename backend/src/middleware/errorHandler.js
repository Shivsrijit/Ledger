function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong. Please try again.";

  // Postgres / unexpected errors — log in dev so the real cause shows in the terminal.
  if (process.env.NODE_ENV !== "production" && !err.statusCode) {
    console.error("[API]", req.method, req.originalUrl, err.code || "", err.message);
  }

  if (err.code === "23505") {
    message = "This value already exists (for example, that email may be taken).";
    return res.status(409).json({
      success: false,
      message,
      details: err.details || null
    });
  }

  if (err.code === "42703") {
    message =
      "Database schema is missing new columns (e.g. financial_records.deleted or users.is_primary_admin). From the backend folder run: npm run db:migrate — then restart the server.";
    return res.status(500).json({
      success: false,
      message,
      details: process.env.NODE_ENV !== "production" ? { hint: err.message } : null
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || null
  });
}

module.exports = { errorHandler };
