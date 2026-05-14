const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { listDoctors, notifications, patientTimeline, readAllNotifications, readNotification } = require('../controllers/userController');
const appointmentController = require('../controllers/appointmentController');
const recordController = require('../controllers/recordController');
const { getSlots } = require('../controllers/scheduleController');

router.use(authenticate, authorize('patient'));
router.get('/dashboard', notifications);
router.get('/notifications', notifications);
router.patch('/notifications/read-all', readAllNotifications);
router.patch('/notifications/:id/read', readNotification);
router.get('/doctors', listDoctors);
router.get('/time-slots', getSlots);
router.get('/appointments', appointmentController.list);
router.post('/appointments', appointmentController.book);
router.patch('/appointments/:id/cancel', appointmentController.cancel);
router.patch('/appointments/:id/reschedule', appointmentController.reschedule);
router.post('/waitlist', appointmentController.waitlist);
router.get('/records', recordController.list);
router.get('/timeline/:patientId', patientTimeline);

module.exports = router;
