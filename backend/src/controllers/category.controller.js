const { ApiError } = require("../utils/apiError");
const { listCategories, createCategory, deleteCategory } = require("../models/category.model");

async function getCategories(req, res, next) {
  try {
    const data = await listCategories();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function postCategory(req, res, next) {
  try {
    const data = await createCategory(req.body.name);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function removeCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new ApiError(400, "Invalid category id");
    const ok = await deleteCategory(id);
    if (!ok) throw new ApiError(404, "Category not found");
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCategories, postCategory, removeCategory };
