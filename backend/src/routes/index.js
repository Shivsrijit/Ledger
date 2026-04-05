// Aggregates all API routers under /api.
// Domain routers live alongside this file; each exports an Express Router instance.
 
const express = require("express");
const { sanitizeInput } = require("../middleware/sanitizeInput");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const recordRoutes = require("./record.routes");
const dashboardRoutes = require("./dashboard.routes");
const categoryRoutes = require("./category.routes");

const router = express.Router();

router.use(sanitizeInput);

router.get("/health", (req, res) => {
  res.json({ success: true, message: "Finance backend running" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/records", recordRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/categories", categoryRoutes);

module.exports = router;
