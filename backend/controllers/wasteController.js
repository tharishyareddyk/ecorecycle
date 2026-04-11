const WasteRequest = require('../models/WasteRequest');
const Facility = require('../models/Facility');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Compensation estimate helper
const estimateCompensation = (wasteItems, compensationRates) => {
  let total = 0;
  for (const item of wasteItems) {
    const rate = compensationRates[item.category] || 10;
    const weight = item.estimatedWeight || 1;
    total += rate * weight;
  }
  return total;
};

// @desc  Submit waste request
// @route POST /api/waste
exports.submitWasteRequest = async (req, res) => {
  try {
    const {
      facilityId, wasteItems, wasteCategory, serviceType,
      pickupAddress, pickupLocation, scheduledDate, scheduledTime, userNotes
    } = req.body;

    if (serviceType === 'pickup' && wasteCategory === 'small') {
      return res.status(400).json({ success: false, message: 'Pickup service is only available for bulk waste' });
    }
    if (serviceType === 'pickup' && !pickupAddress) {
      return res.status(400).json({ success: false, message: 'Pickup address is required for pickup service' });
    }

    const facility = await Facility.findById(facilityId);
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });

    const estimatedCompensation = estimateCompensation(wasteItems, facility.compensationRates);
    const totalEstimatedWeight = wasteItems.reduce((sum, item) => sum + (item.estimatedWeight || 0), 0);

    const request = await WasteRequest.create({
      user: req.user._id,
      facility: facilityId,
      wasteItems,
      wasteCategory,
      serviceType,
      pickupAddress,
      pickupLocation,
      scheduledDate,
      scheduledTime,
      userNotes,
      estimatedCompensation,
      totalEstimatedWeight
    });

    // Notify recycler
    await Notification.create({
      recipient: facility.registeredBy,
      type: 'new_request',
      title: 'New Waste Request',
      message: `New ${serviceType} request from ${req.user.name} for ${wasteItems.length} item(s)`,
      wasteRequest: request._id
    });

    res.status(201).json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get user's waste requests
// @route GET /api/waste/my
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await WasteRequest.find({ user: req.user._id })
      .populate('facility', 'name address phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Track by tracking ID (public)
// @route GET /api/waste/track/:trackingId
exports.trackByTrackingId = async (req, res) => {
  try {
    const request = await WasteRequest.findOne({ trackingId: req.params.trackingId })
      .populate('facility', 'name address phone email')
      .populate('user', 'name email phone');
    if (!request) return res.status(404).json({ success: false, message: 'Tracking ID not found' });

    res.json({
      success: true,
      tracking: {
        trackingId: request.trackingId,
        status: request.status,
        facility: request.facility,
        user: { name: request.user.name },
        wasteCategory: request.wasteCategory,
        serviceType: request.serviceType,
        scheduledDate: request.scheduledDate,
        estimatedCompensation: request.estimatedCompensation,
        finalCompensation: request.finalCompensation,
        compensationStatus: request.compensationStatus,
        totalActualWeight: request.totalActualWeight,
        requestedAt: request.requestedAt,
        collectedAt: request.collectedAt,
        processingStartedAt: request.processingStartedAt,
        recycledAt: request.recycledAt,
        recyclerNotes: request.recyclerNotes
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single request detail
// @route GET /api/waste/:id
exports.getRequest = async (req, res) => {
  try {
    const request = await WasteRequest.findById(req.params.id)
      .populate('facility', 'name address phone compensationRates')
      .populate('user', 'name email phone companyName');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    // Only owner or facility recycler can see
    if (
      request.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'recycler'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Cancel request (user)
// @route PUT /api/waste/:id/cancel
exports.cancelRequest = async (req, res) => {
  try {
    const request = await WasteRequest.findOne({ _id: req.params.id, user: req.user._id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (!['pending', 'confirmed'].includes(request.status))
      return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' });
    request.status = 'cancelled';
    await request.save();
    res.json({ success: true, message: 'Request cancelled', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
