const User = require('../models/User');
const Facility = require('../models/Facility');
const WasteRequest = require('../models/WasteRequest');
const Notification = require('../models/Notification');

// Helper — send notification to a user and push via socket if online
const sendNotification = async (req, recipientId, type, title, message, extra = {}) => {
  const notif = await Notification.create({ recipient: recipientId, type, title, message, ...extra });
  const io = req.app.get('io');
  const connectedUsers = req.app.get('connectedUsers');
  const socketId = connectedUsers?.[recipientId.toString()];
  if (io && socketId) io.to(socketId).emit('notification', notif);
};

// @desc  Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter).select('-password').skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, total, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Toggle user active/inactive
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve facility
// @route PUT /api/admin/facilities/:id/approve
exports.approveFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });

    facility.isVerified = true;
    facility.isRejected = false;
    facility.rejectionReason = '';
    await facility.save();

    // Notify the recycler
    await sendNotification(req, facility.registeredBy, 'system',
      '🎉 Facility Approved!',
      `Congratulations! Your facility "${facility.name}" has been verified and is now live on EcoRecycle. Users can now find and submit requests to your facility.`
    );

    res.json({ success: true, message: 'Facility approved', facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reject facility
// @route PUT /api/admin/facilities/:id/reject
exports.rejectFacility = async (req, res) => {
  try {
    const { reason } = req.body;
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });

    facility.isVerified = false;
    facility.isRejected = true;
    facility.rejectionReason = reason || 'Your application did not meet our requirements.';
    await facility.save();

    // Notify the recycler
    await sendNotification(req, facility.registeredBy, 'system',
      '❌ Facility Application Rejected',
      `Unfortunately, your facility "${facility.name}" was not approved. Reason: ${facility.rejectionReason} Please update your details and certifications and resubmit.`
    );

    res.json({ success: true, message: 'Facility rejected', facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Legacy toggle (kept for compatibility)
exports.verifyFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
    facility.isVerified = !facility.isVerified;
    if (facility.isVerified) { facility.isRejected = false; facility.rejectionReason = ''; }
    await facility.save();
    res.json({ success: true, facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get system dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalFacilities, totalRequests, requestsByStatus] = await Promise.all([
      User.countDocuments(),
      Facility.countDocuments(),
      WasteRequest.countDocuments(),
      WasteRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalWeight: { $sum: '$totalActualWeight' } } }
      ])
    ]);

    const totalWasteRecycled = await WasteRequest.aggregate([
      { $match: { status: 'recycled' } },
      { $group: { _id: null, total: { $sum: '$totalActualWeight' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalFacilities, totalRequests, requestsByStatus,
        totalWasteRecycled: totalWasteRecycled[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all waste requests (admin view)
exports.getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const requests = await WasteRequest.find(filter)
      .populate('user', 'name email role')
      .populate('facility', 'name city')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await WasteRequest.countDocuments(filter);
    res.json({ success: true, total, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};