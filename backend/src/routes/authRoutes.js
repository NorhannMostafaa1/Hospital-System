const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { me, patchMe, signin, signup } = require('../controllers/authController');

router.post('/signup', signup('patient'));
router.post('/login', signin());
router.post('/patient/signup', signup('patient'));
router.post('/patient/login', signin('patient'));
router.post('/doctor/signup', signup('doctor'));
router.post('/doctor/login', signin('doctor'));
router.get('/me', authenticate, me);
router.patch('/me', authenticate, patchMe);

module.exports = router;
