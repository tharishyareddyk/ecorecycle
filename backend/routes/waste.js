const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  submitWasteRequest, getMyRequests,
  trackByTrackingId, getRequest, cancelRequest
} = require('../controllers/wasteController');

router.get('/track/:trackingId', trackByTrackingId); // public
router.use(protect);
router.post('/', submitWasteRequest);
router.get('/my', getMyRequests);
router.get('/:id', getRequest);
router.put('/:id/cancel', cancelRequest);

module.exports = router;
