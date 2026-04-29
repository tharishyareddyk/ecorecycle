// Run this from your backend folder:
//   node createAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Change these if you want a different admin account ──
const ADMIN_NAME     = 'Admin';
const ADMIN_EMAIL    = 'admin@ecorecycle.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_PHONE    = '9999999999';
// ────────────────────────────────────────────────────────

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const User = require('./models/User');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    // If user exists but isn't admin, promote them
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`✅ Promoted existing user "${ADMIN_EMAIL}" to admin.`);
    } else {
      console.log(`ℹ️  Admin "${ADMIN_EMAIL}" already exists. Nothing to do.`);
    }
    await mongoose.disconnect();
    return;
  }

  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password,
    phone: ADMIN_PHONE,
    role: 'admin',
    isVerified: true,
    isActive: true,
  });

  console.log('✅ Admin user created successfully!');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('   ⚠️  Change the password after logging in!');

  await mongoose.disconnect();
}

createAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
