const User = require('../models/User');
const Facility = require('../models/Facility');
const WasteRequest = require('../models/WasteRequest');

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

// @desc  Verify/unverify facility
exports.verifyFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
    facility.isVerified = !facility.isVerified;
    await facility.save();
    res.json({ success: true, message: `Facility ${facility.isVerified ? 'verified' : 'unverified'}`, facility });
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
        totalUsers,
        totalFacilities,
        totalRequests,
        requestsByStatus,
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
