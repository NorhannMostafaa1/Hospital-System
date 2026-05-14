const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { amend, create, downloadAttachment, list, lock, show, uploadAttachments } = require('../controllers/recordController');

router.use(authenticate);
router.get('/', list);
router.get('/:id', show);
router.get('/:id/attachments/:attachmentId/download', downloadAttachment);
router.post('/', authorize('doctor'), create);
router.patch('/:id/amend', authorize('doctor'), amend);
router.patch('/:id/lock', authorize('doctor'), lock);
router.post('/:id/attachments', authorize('doctor'), upload.array('files', 5), uploadAttachments);

module.exports = router;
