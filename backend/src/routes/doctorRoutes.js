const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');
const recordController = require('../controllers/recordController');
const { notifications, patientTimeline, readAllNotifications, readNotification } = require('../controllers/userController');
const { setOverride, updateMySchedule } = require('../controllers/scheduleController');

router.use(authenticate, authorize('doctor'));
router.get('/dashboard', appointmentController.list);
router.get('/notifications', notifications);
router.patch('/notifications/read-all', readAllNotifications);
router.patch('/notifications/:id/read', readNotification);
router.get('/schedule', appointmentController.list);
router.get('/waitlist', appointmentController.listWaitlist);
router.patch('/waitlist/:id/accept', appointmentController.acceptWaitlist);
router.patch('/waitlist/:id/reject', appointmentController.rejectWaitlist);
router.patch('/settings/working-hours', updateMySchedule);
router.patch('/schedule/day-availability', setOverride);
router.patch('/schedule/day-unavailable', setOverride);
router.patch('/appointments/:id/status', appointmentController.changeStatus);
router.patch('/appointments/:id/cancel', appointmentController.cancel);
router.patch('/appointments/:id/reschedule', appointmentController.reschedule);
router.get('/patients/:patientId/timeline', patientTimeline);
router.get('/records', recordController.list);
router.post('/records', recordController.create);
router.patch('/records/:id/amend', recordController.amend);

module.exports = router;
