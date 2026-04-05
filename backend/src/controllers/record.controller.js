const { ApiError } = require("../utils/apiError");
const {
  createRecord,
  getRecordById,
  listRecords,
  updateRecord,
  softDeleteRecord
} = require("../models/record.model");

async function postRecord(req, res, next) {
  try {
    const record = await createRecord(req.body, req.user.id);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

async function getRecords(req, res, next) {
  try {
    const result = await listRecords(req.query, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getSingleRecord(req, res, next) {
  try {
    const id = Number(req.params.id);
    const record = await getRecordById(id, req.user);
    if (!record) throw new ApiError(404, "Record not found or already archived.");
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

async function patchRecord(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await getRecordById(id, req.user);
    if (!existing) throw new ApiError(404, "Record not found or already archived.");
    const record = await updateRecord(id, req.body);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

async function removeRecord(req, res, next) {
  try {
    const id = Number(req.params.id);
    const success = await softDeleteRecord(id);
    if (!success) throw new ApiError(404, "Record not found or already archived.");
    res.json({
      success: true,
      message: "Record archived successfully. It no longer appears in reports or lists."
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { postRecord, getRecords, getSingleRecord, patchRecord, removeRecord };
