const asyncHandler = require('../utils/asyncHandler');
const { assertObjectId, required } = require('../validators/validate');
const {
  generateAvailableSlots,
  updateWeeklySchedule,
  upsertAvailabilityOverride,
} = require('../services/scheduleService');

const getSlots = asyncHandler(async (req, res) => {
  assertObjectId(req.query.doctorId, 'doctorId');
  required(req.query, ['from']);
  const slots = await generateAvailableSlots({
    doctorId: req.query.doctorId,
    from: req.query.from,
    to: req.query.to || req.query.from,
    appointmentType: req.query.appointmentType || 'consultation',
  });
  res.json({ success: true, data: slots });
});

const updateMySchedule = asyncHandler(async (req, res) => {
  required(req.body, ['weeklySchedule']);
  const profile = await updateWeeklySchedule(req.user.id, req.body, req.user.id, req);
  res.json({ success: true, data: profile });
});

const updateDoctorSchedule = asyncHandler(async (req, res) => {
  assertObjectId(req.params.doctorId, 'doctorId');
  required(req.body, ['weeklySchedule']);
  const profile = await updateWeeklySchedule(req.params.doctorId, req.body, req.user.id, req);
  res.json({ success: true, data: profile });
});

const setOverride = asyncHandler(async (req, res) => {
  required(req.body, ['date']);
  const doctorId = req.params.doctorId || req.user.id;
  const override = await upsertAvailabilityOverride(doctorId, req.body, req.user.id, req);
  res.json({ success: true, data: override });
});

module.exports = { getSlots, setOverride, updateDoctorSchedule, updateMySchedule };
