const asyncHandler = require('../utils/asyncHandler');
const { assertObjectId, required } = require('../validators/validate');
const {
  acceptWaitlistEntry,
  bookAppointment,
  cancelAppointment,
  joinWaitlist,
  listAppointments,
  listWaitlistEntries,
  rejectWaitlistEntry,
  rescheduleAppointment,
  runAutomaticTransitions,
  transitionAppointment,
} = require('../services/appointmentService');

const list = asyncHandler(async (req, res) => {
  const appointments = await listAppointments(req.user, req.query);
  res.json({ success: true, data: appointments });
});

const book = asyncHandler(async (req, res) => {
  required(req.body, ['doctorId', 'startsAt', 'appointmentType']);
  assertObjectId(req.body.doctorId, 'doctorId');
  const patientId = req.user.role === 'patient' ? req.user.id : req.body.patientId;
  if (req.user.role !== 'patient') assertObjectId(patientId, 'patientId');
  const appointment = await bookAppointment({ ...req.body, patientId }, req.user.id, req);
  res.status(201).json({ success: true, data: appointment });
});

const changeStatus = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  required(req.body, ['status']);
  const appointment = await transitionAppointment({ id: req.params.id, ...req.body }, req.user, req);
  res.json({ success: true, data: appointment });
});

const cancel = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const appointment = await cancelAppointment({ id: req.params.id, reason: req.body.reason }, req.user, req);
  res.json({ success: true, data: appointment });
});

const reschedule = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  required(req.body, ['startsAt', 'reason']);
  const appointment = await rescheduleAppointment({ id: req.params.id, ...req.body }, req.user, req);
  res.json({ success: true, data: appointment });
});

const waitlist = asyncHandler(async (req, res) => {
  required(req.body, ['doctorId', 'appointmentType']);
  const entry = await joinWaitlist({ ...req.body, patientId: req.user.id });
  res.status(201).json({ success: true, data: entry });
});

const listWaitlist = asyncHandler(async (req, res) => {
  const entries = await listWaitlistEntries(req.user, req.query);
  res.json({ success: true, data: entries });
});

const acceptWaitlist = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  required(req.body, ['startsAt']);
  const result = await acceptWaitlistEntry({ id: req.params.id, startsAt: req.body.startsAt }, req.user, req);
  res.json({ success: true, data: result });
});

const rejectWaitlist = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const entry = await rejectWaitlistEntry({ id: req.params.id, reason: req.body.reason }, req.user, req);
  res.json({ success: true, data: entry });
});

const autoTransitions = asyncHandler(async (_req, res) => {
  const result = await runAutomaticTransitions();
  res.json({ success: true, data: result });
});

module.exports = { acceptWaitlist, autoTransitions, book, cancel, changeStatus, list, listWaitlist, rejectWaitlist, reschedule, waitlist };
