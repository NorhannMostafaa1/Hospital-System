const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getSlots,
  setOverride,
  updateDoctorSchedule,
  updateMySchedule,
} = require('../controllers/scheduleController');

router.get('/slots', authenticate, getSlots);
router.patch('/me', authenticate, authorize('doctor'), updateMySchedule);
router.patch('/me/override', authenticate, authorize('doctor'), setOverride);

module.exports = router;
