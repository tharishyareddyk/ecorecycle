const WasteRequest = require('../models/WasteRequest');
const Facility = require('../models/Facility');
const Notification = require('../models/Notification');
const User = require('../models/User');
const generateTrackingId = require('../utils/generateTrackingId');

// @desc  Get all requests for this recycler's facility
// @route GET /api/recycler/requests
exports.getFacilityRequests = async (req, res) => {
  try {
    const facility = await Facility.findOne({ registeredBy: req.user._id });
    if (!facility) return res.status(404).json({ success: false, message: 'No facility found for this recycler' });

    const { status, serviceType, page = 1, limit = 20 } = req.query;
    const filter = { facility: facility._id };
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;

    const requests = await WasteRequest.find(filter)
      .populate('user', 'name email phone companyName address role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await WasteRequest.countDocuments(filter);
    res.json({ success: true, total, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Confirm request (recycler accepts it)
// @route PUT /api/recycler/requests/:id/confirm
exports.confirmRequest = async (req, res) => {
  try {
    const request = await WasteRequest.findById(req.params.id).populate('user', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Request is not pending' });

    request.status = 'confirmed';
    request.confirmedAt = Date.now();
    await request.save();

    await Notification.create({
      recipient: request.user._id,
      type: 'request_confirmed',
      title: 'Request Confirmed!',
      message: `Your waste disposal request has been confirmed. ${request.serviceType === 'pickup' ? 'Our team will arrive at your location on the scheduled date.' : 'Please drop off your waste at the facility on the scheduled date.'}`,
      wasteRequest: request._id
    });

    res.json({ success: true, message: 'Request confirmed', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Mark as collected + generate tracking ID
// @route PUT /api/recycler/requests/:id/collect
exports.markCollected = async (req, res) => {
  try {
    const { actualWeights, recyclerNotes } = req.body;
    const request = await WasteRequest.findById(req.params.id).populate('user facility');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (!['confirmed', 'pending'].includes(request.status))
      return res.status(400).json({ success: false, message: 'Request cannot be marked as collected at this stage' });

    // Update actual weights for each item
    if (actualWeights && Array.isArray(actualWeights)) {
      for (let i = 0; i < actualWeights.length && i < request.wasteItems.length; i++) {
        request.wasteItems[i].actualWeight = actualWeights[i];
      }
    }

    // Calculate total actual weight
    request.totalActualWeight = request.wasteItems.reduce((sum, item) => sum + (item.actualWeight || item.estimatedWeight || 0), 0);

    // Generate tracking ID
    request.trackingId = generateTrackingId();
    request.status = 'collected';
    request.collectedAt = Date.now();
    if (recyclerNotes) request.recyclerNotes = recyclerNotes;

    await request.save();

    // Notify user with tracking ID
    await Notification.create({
      recipient: request.user._id,
      type: 'request_collected',
      title: 'E-Waste Collected! ✅',
      message: `Your e-waste has been collected. Your Tracking ID is: ${request.trackingId}. Use this to track your waste lifecycle.`,
      wasteRequest: request._id,
      trackingId: request.trackingId
    });

    res.json({ success: true, message: 'Marked as collected. Tracking ID generated.', trackingId: request.trackingId, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Mark as processing
// @route PUT /api/recycler/requests/:id/process
exports.markProcessing = async (req, res) => {
  try {
    const request = await WasteRequest.findById(req.params.id);
    if (!request || request.status !== 'collected')
      return res.status(400).json({ success: false, message: 'Request must be collected before processing' });

    request.status = 'processing';
    request.processingStartedAt = Date.now();
    await request.save();

    await Notification.create({
      recipient: request.user,
      type: 'processing_started',
      title: 'Waste Being Processed 🔄',
      message: `Your e-waste (ID: ${request.trackingId}) is currently being processed at the facility.`,
      wasteRequest: request._id,
      trackingId: request.trackingId
    });

    res.json({ success: true, message: 'Status updated to processing', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Mark as recycled + set final compensation
// @route PUT /api/recycler/requests/:id/recycle
exports.markRecycled = async (req, res) => {
  try {
    const { finalCompensation } = req.body;
    const request = await WasteRequest.findById(req.params.id);
    if (!request || request.status !== 'processing')
      return res.status(400).json({ success: false, message: 'Request must be in processing state' });

    request.status = 'recycled';
    request.recycledAt = Date.now();
    if (finalCompensation !== undefined) {
      request.finalCompensation = finalCompensation;
      request.compensationStatus = 'verified';
    }
    await request.save();

    // Update facility stats
    await Facility.findByIdAndUpdate(request.facility, {
      $inc: { totalWasteProcessed: request.totalActualWeight || request.totalEstimatedWeight }
    });

    // Update user stats
    await User.findByIdAndUpdate(request.user, {
      $inc: {
        totalEwasteSubmitted: request.totalActualWeight || request.totalEstimatedWeight,
        totalCompensationEarned: request.finalCompensation
      }
    });

    await Notification.create({
      recipient: request.user,
      type: 'recycled_complete',
      title: 'E-Waste Recycled Successfully ♻️',
      message: `Your e-waste (ID: ${request.trackingId}) has been fully recycled! Final compensation: ₹${request.finalCompensation}. Great job contributing to a greener planet!`,
      wasteRequest: request._id,
      trackingId: request.trackingId
    });

    res.json({ success: true, message: 'Marked as recycled', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get user disposal history (for recycler view)
// @route GET /api/recycler/users/:userId/history
exports.getUserHistory = async (req, res) => {
  try {
    const facility = await Facility.findOne({ registeredBy: req.user._id });
    const requests = await WasteRequest.find({ user: req.params.userId, facility: facility._id })
      .sort({ createdAt: -1 });
    const user = await User.findById(req.params.userId).select('name email phone companyName role totalEwasteSubmitted totalCompensationEarned');
    res.json({ success: true, user, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get recycler dashboard stats
// @route GET /api/recycler/stats
exports.getRecyclerStats = async (req, res) => {
  try {
    const facility = await Facility.findOne({ registeredBy: req.user._id });
    if (!facility) return res.status(404).json({ success: false, message: 'No facility found' });

    const stats = await WasteRequest.aggregate([
      { $match: { facility: facility._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalWeight: { $sum: '$totalActualWeight' }
        }
      }
    ]);

    res.json({ success: true, facility: { name: facility.name, totalWasteProcessed: facility.totalWasteProcessed }, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
