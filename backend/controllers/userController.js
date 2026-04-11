const User = require('../models/User');
const Notification = require('../models/Notification');
const WasteRequest = require('../models/WasteRequest');

// @desc  Update profile
// @route PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, location, companyName, companyRegNumber, gstNumber } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, location, companyName, companyRegNumber, gstNumber },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Change password
// @route PUT /api/users/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get notifications
// @route GET /api/users/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, unreadCount, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Mark notification as read
// @route PUT /api/users/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Mark all notifications as read
// @route PUT /api/users/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get disposal history + stats
// @route GET /api/users/history
exports.getDisposalHistory = async (req, res) => {
  try {
    const requests = await WasteRequest.find({ user: req.user._id })
      .populate('facility', 'name address')
      .sort({ createdAt: -1 });
    const user = await User.findById(req.user._id).select('totalEwasteSubmitted totalCompensationEarned');
    res.json({ success: true, stats: { totalEwasteSubmitted: user.totalEwasteSubmitted, totalCompensationEarned: user.totalCompensationEarned }, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
