const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const {
  createFacility, getNearbyFacilities, getFacility,
  updateFacility, addCollectionEvent, getAllFacilities
} = require('../controllers/facilityController');

router.get('/', getAllFacilities);
router.get('/nearby', getNearbyFacilities);
router.get('/:id', getFacility);
router.post('/', protect, authorize('recycler', 'admin'), createFacility);
router.put('/:id', protect, authorize('recycler', 'admin'), updateFacility);
router.post('/:id/events', protect, authorize('recycler', 'admin'), addCollectionEvent);

module.exports = router;
