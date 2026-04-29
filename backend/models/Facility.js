const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },

  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },

  acceptedWasteTypes: [{
    type: String,
    enum: [
      'mobile_phones', 'laptops', 'computers', 'televisions',
      'refrigerators', 'washing_machines', 'air_conditioners',
      'batteries', 'printers', 'tablets', 'cameras',
      'audio_equipment', 'cables_accessories', 'other'
    ]
  }],

  certifications: [{
    name: String,
    issuedBy: String,
    validUntil: Date,
    documentUrl: String,
    fileName: String,
  }],

  operatingHours: {
    weekdays: String,
    weekends: String
  },

  collectionEvents: [{
    title: String,
    date: Date,
    location: String,
    description: String,
    maxCapacity: Number
  }],

  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Rejection
  isRejected: { type: Boolean, default: false },
  rejectionReason: { type: String, default: '' },

  compensationRates: {
    mobile_phones: { type: Number, default: 50 },
    laptops: { type: Number, default: 80 },
    computers: { type: Number, default: 60 },
    televisions: { type: Number, default: 30 },
    refrigerators: { type: Number, default: 25 },
    washing_machines: { type: Number, default: 20 },
    air_conditioners: { type: Number, default: 35 },
    batteries: { type: Number, default: 40 },
    printers: { type: Number, default: 45 },
    tablets: { type: Number, default: 55 },
    cameras: { type: Number, default: 60 },
    audio_equipment: { type: Number, default: 30 },
    cables_accessories: { type: Number, default: 15 },
    other: { type: Number, default: 10 }
  },

  totalWasteProcessed: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

facilitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Facility', facilitySchema);