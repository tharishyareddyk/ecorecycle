const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: {
    type: String,
    enum: ['individual', 'company', 'recycler', 'admin'],
    default: 'individual'
  },
  // Company-specific
  companyName: { type: String },
  companyRegNumber: { type: String },
  gstNumber: { type: String },

  // Address / location
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },

  // Recycler-specific
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' },

  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  totalEwasteSubmitted: { type: Number, default: 0 }, // in kg
  totalCompensationEarned: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
