const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const {
  getAllUsers, toggleUserStatus, verifyFacility,
  getDashboardStats, getAllRequests
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.put('/facilities/:id/verify', verifyFacility);
router.get('/requests', getAllRequests);

module.exports = router;
