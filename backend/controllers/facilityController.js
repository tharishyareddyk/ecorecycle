const Facility = require('../models/Facility');
const User = require('../models/User');

// @desc  Register a facility (recycler)
// @route POST /api/facilities
exports.createFacility = async (req, res) => {
  try {
    const facility = await Facility.create({ ...req.body, registeredBy: req.user._id });
    // Link facility to user
    await User.findByIdAndUpdate(req.user._id, { facilityId: facility._id });
    res.status(201).json({ success: true, facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get facilities near location (GPS-based)
// @route GET /api/facilities/nearby?lat=&lng=&maxDistance=&wasteType=
exports.getNearbyFacilities = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 20000, wasteType } = req.query;
    if (!lat || !lng)
      return res.status(400).json({ success: false, message: 'lat and lng are required' });

    const query = {
      isActive: true,
      isVerified: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance) // meters
        }
      }
    };
    if (wasteType) query.acceptedWasteTypes = wasteType;

    const facilities = await Facility.find(query).select('-__v');
    res.json({ success: true, count: facilities.length, facilities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single facility
// @route GET /api/facilities/:id
exports.getFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id).populate('registeredBy', 'name email');
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
    res.json({ success: true, facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update facility
// @route PUT /api/facilities/:id
exports.updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findOneAndUpdate(
      { _id: req.params.id, registeredBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found or not authorized' });
    res.json({ success: true, facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Add collection event
// @route POST /api/facilities/:id/events
exports.addCollectionEvent = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
    facility.collectionEvents.push(req.body);
    await facility.save();
    res.json({ success: true, facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all facilities (admin / public list)
// @route GET /api/facilities
exports.getAllFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find({ isActive: true }).select('-__v');
    res.json({ success: true, count: facilities.length, facilities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
