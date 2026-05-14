const asyncHandler = require('../utils/asyncHandler');
const { assertObjectId, required } = require('../validators/validate');
const {
  addAttachments,
  amendRecord,
  createRecord,
  getAttachment,
  getRecord,
  listRecords,
  lockRecord,
} = require('../services/medicalRecordService');

const list = asyncHandler(async (req, res) => {
  const records = await listRecords(req.user, req.query);
  res.json({ success: true, data: records });
});

const show = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const record = await getRecord(req.params.id, req.user);
  res.json({ success: true, data: record });
});

const create = asyncHandler(async (req, res) => {
  required(req.body, ['appointment', 'diagnosis']);
  const record = await createRecord(req.body, req.user, req);
  res.status(201).json({ success: true, data: record });
});

const amend = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  required(req.body, ['reason']);
  const record = await amendRecord(req.params.id, req.body, req.user, req);
  res.json({ success: true, data: record });
});

const lock = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const record = await lockRecord(req.params.id, req.user, req);
  res.json({ success: true, data: record });
});

const uploadAttachments = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const record = await addAttachments(req.params.id, req.files, req.user, req);
  res.json({ success: true, data: record });
});

const downloadAttachment = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  assertObjectId(req.params.attachmentId, 'attachmentId');
  const attachment = await getAttachment(req.params.id, req.params.attachmentId, req.user);
  res.download(attachment.path, attachment.originalName);
});

module.exports = { amend, create, downloadAttachment, list, lock, show, uploadAttachments };
