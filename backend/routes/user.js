const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  updateProfile, changePassword,
  getNotifications, markNotificationRead, markAllRead,
  getDisposalHistory
} = require('../controllers/userController');

router.use(protect);

router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllRead);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/history', getDisposalHistory);

module.exports = router;
