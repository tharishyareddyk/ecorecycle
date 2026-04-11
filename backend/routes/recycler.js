const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const {
  getFacilityRequests, confirmRequest, markCollected,
  markProcessing, markRecycled, getUserHistory, getRecyclerStats
} = require('../controllers/recyclerController');

router.use(protect, authorize('recycler', 'admin'));

router.get('/requests', getFacilityRequests);
router.get('/stats', getRecyclerStats);
router.get('/users/:userId/history', getUserHistory);
router.put('/requests/:id/confirm', confirmRequest);
router.put('/requests/:id/collect', markCollected);
router.put('/requests/:id/process', markProcessing);
router.put('/requests/:id/recycle', markRecycled);

module.exports = router;
