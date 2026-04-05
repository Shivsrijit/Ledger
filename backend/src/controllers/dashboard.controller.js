const {
  getSummary,
  getCategoryTotals,
  getRecentActivity,
  getTrends
} = require("../models/dashboard.model");

async function summary(req, res, next) {
  try {
    const data = await getSummary(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function categories(req, res, next) {
  try {
    const data = await getCategoryTotals(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function recent(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 10;
    const data = await getRecentActivity(limit, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}


// Query: granularity=month|week, periods=6 (months or weeks to include).

async function trends(req, res, next) {
  try {
    const g = req.query.granularity === "week" ? "week" : "month";
    const periods = Number(req.query.periods);
    const data = await getTrends(req.user, {
      granularity: g,
      periods: Number.isFinite(periods) ? periods : 6
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { summary, categories, recent, trends };
