const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'request_confirmed', 'request_collected', 'processing_started',
      'recycled_complete', 'compensation_paid', 'pickup_scheduled',
      'new_request', 'system'
    ]
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  wasteRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'WasteRequest' },
  trackingId: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
