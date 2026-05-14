const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  autoTransitions,
  book,
  cancel,
  changeStatus,
  list,
  reschedule,
  waitlist,
} = require('../controllers/appointmentController');

router.use(authenticate);
router.get('/', list);
router.post('/', authorize('patient'), book);
router.post('/waitlist', authorize('patient'), waitlist);
router.post('/automatic-transitions', authorize('doctor'), autoTransitions);
router.patch('/:id/status', authorize('doctor'), changeStatus);
router.patch('/:id/cancel', cancel);
router.patch('/:id/reschedule', reschedule);

module.exports = router;
